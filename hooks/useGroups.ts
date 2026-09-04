import { useReducer, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Group = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  invite_code: string;
  role: string;
  member_count: number;
};

type State = {
  groups: Group[];
  loading: boolean;
  createGroupName: string;
  createGroupDescription: string;
  joinInviteCode: string;
  actionStatus: "idle" | "loading" | "success" | "error";
  actionMessage: string;
  newInviteCode: string;
};

const initialState: State = {
  groups: [],
  loading: true,
  createGroupName: "",
  createGroupDescription: "",
  joinInviteCode: "",
  actionStatus: "idle",
  actionMessage: "",
  newInviteCode: "",
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Group[] }
  | { type: 'RESET' }
  | { type: 'SET_INPUT'; field: 'createGroupName' | 'createGroupDescription' | 'joinInviteCode'; value: string }
  | { type: 'SET_ACTION_STATE'; status: State['actionStatus']; message: string; newCode?: string }
  | { type: 'DISMISS_ACTION_MESSAGE' }
  | { type: 'DISMISS_INVITE_CODE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, groups: action.payload, loading: false };
    case 'RESET':
      return initialState;
    case 'SET_INPUT':
      return { ...state, [action.field]: action.value };
    case 'SET_ACTION_STATE':
      return { 
        ...state, 
        actionStatus: action.status, 
        actionMessage: action.message,
        ...(action.newCode !== undefined && { newInviteCode: action.newCode })
      };
    case 'DISMISS_ACTION_MESSAGE':
      return { ...state, actionMessage: "" };
    case 'DISMISS_INVITE_CODE':
      return { ...state, newInviteCode: "" };
    default:
      return state;
  }
}

export function useGroups(user: any) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'RESET' });
      dispatch({ type: 'FETCH_SUCCESS', payload: [] });
      return [];
    }

    dispatch({ type: 'FETCH_START' });
    const supabase = createClient();
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, role, groups(id, name, invite_code, created_at)');
    
    if (!error && data) {
      const groupIds = data.map((item: any) => item.groups?.id).filter(Boolean);
      const inviteCodes = data.map((item: any) => item.groups?.invite_code).filter(Boolean);
      
      const memberCountMap: Record<string, number> = {};
      if (groupIds.length > 0) {
        try {
          const { data: memberData } = await supabase
            .from('group_members')
            .select('group_id')
            .in('group_id', groupIds);
            
          if (memberData) {
            memberData.forEach((row: any) => {
              memberCountMap[row.group_id] = (memberCountMap[row.group_id] || 0) + 1;
            });
          }
        } catch (e) {
          console.error("Failed to fetch member counts:", e);
        }
      }

      // Fetch circle metadata (description and created_at) from Redis meta endpoint
      let metaMap: Record<string, { description?: string | null; createdAt?: string | null }> = {};
      if (groupIds.length > 0 || inviteCodes.length > 0) {
        try {
          const metaRes = await fetch(`/api/circles/meta?circleIds=${encodeURIComponent(groupIds.join(','))}&inviteCodes=${encodeURIComponent(inviteCodes.join(','))}`);
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            metaMap = metaJson.meta || {};
          }
        } catch (err) {
          console.warn("Could not fetch circle meta:", err);
        }
      }

      const formatted = data.map((item: any) => {
        const idMeta = metaMap[item.groups.id];
        const codeMeta = metaMap[item.groups.invite_code];
        const description = (idMeta?.description ?? codeMeta?.description) ?? null;
        const createdAt = idMeta?.createdAt ?? codeMeta?.createdAt ?? item.groups.created_at ?? null;
        return {
          id: item.groups.id,
          name: item.groups.name,
          description,
          created_at: createdAt,
          invite_code: item.groups.invite_code,
          role: item.role,
          member_count: memberCountMap[item.groups.id] || 1
        };
      });

      // Deduplicate as a defensive safety net in case database unique constraint isn't acting perfectly yet
      const seen = new Set();
      const deduplicated = formatted.filter(group => {
        if (seen.has(group.id)) return false;
        seen.add(group.id);
        return true;
      });

      dispatch({ type: 'FETCH_SUCCESS', payload: deduplicated });
      return deduplicated;
    }
    
    dispatch({ type: 'FETCH_SUCCESS', payload: [] });
    return [];
  }, [user]);

  const handleCreateGroup = async () => {
    if (!user) throw new Error("Must be logged in to create a group");
    if (!state.createGroupName.trim()) return;

    dispatch({ type: 'SET_ACTION_STATE', status: 'loading', message: '', newCode: '' });

    try {
      const supabase = createClient();
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const values = new Uint32Array(12);
      window.crypto.getRandomValues(values);
      let code = '';
      for (let i = 0; i < 12; i++) {
        code += charset[values[i] % charset.length];
      }

      const description = state.createGroupDescription?.trim() || null;
      const createdAt = new Date().toISOString();

      const { error } = await supabase.rpc('create_group_with_admin', {
        group_name: state.createGroupName.trim(),
        invite_code: code
      });

      if (error) throw error;
      
      // Save description & creation date to metadata
      try {
        await fetch('/api/circles/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: code,
            description,
            createdAt,
          })
        });
      } catch (metaErr) {
        console.warn("Failed to persist circle meta:", metaErr);
      }

      dispatch({ type: 'SET_ACTION_STATE', status: 'success', message: 'Group created successfully!', newCode: code });
      dispatch({ type: 'SET_INPUT', field: 'createGroupName', value: '' });
      dispatch({ type: 'SET_INPUT', field: 'createGroupDescription', value: '' });
      const updatedGroups = await fetchGroups();
      const createdGroup = updatedGroups.find((g: any) => g.invite_code === code);
      if (createdGroup) {
        fetch('/api/circles/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            circleId: createdGroup.id,
            inviteCode: code,
            description,
            createdAt,
          })
        }).catch(() => {});

        fetch(`/api/circles/${createdGroup.id}/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'MEMBER_JOINED',
            message: `${user.user_metadata?.display_name || user.email?.split("@")[0] || 'Creator'} created and joined the circle`
          })
        }).catch(() => {});
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ACTION_STATE', status: 'error', message: err.message || 'Failed to create group.' });
    }
  };

  const handleJoinGroup = async () => {
    if (!user) throw new Error("Must be logged in to join a group");
    if (!state.joinInviteCode.trim()) return;

    dispatch({ type: 'SET_ACTION_STATE', status: 'loading', message: '', newCode: '' });

    try {
      const supabase = createClient();
      
      const { data: groupData, error: lookupError } = await supabase.rpc('lookup_group_by_invite_code', {
        lookup_code: state.joinInviteCode
      });

      if (lookupError) throw lookupError;
      if (!groupData || groupData.length === 0) {
        throw new Error("Invalid invite code or group not found.");
      }

      const groupId = groupData[0].id;

      // Pre-flight check: acts as a fast-fail UX convenience
      if (state.groups.some(g => g.id === groupId)) {
        throw new Error("You are already a member of this group.");
      }
      
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (joinError) {
        // This is the ultimate source of truth caught from the DB constraint
        if (joinError.code === '23505') throw new Error("You are already a member of this group.");
        throw joinError;
      }
      
      // Log explicit activity event at the source and trigger MEMBER_JOINED notifications
      try {
        await fetch(`/api/circles/${groupId}/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'MEMBER_JOINED',
            message: `${user.user_metadata?.display_name || user.email?.split("@")[0] || 'New member'} joined the circle`
          })
        });
      } catch (actErr) {
        console.warn("Failed to log activity event:", actErr);
      }

      dispatch({ type: 'SET_ACTION_STATE', status: 'success', message: `Successfully joined ${groupData[0].name}!` });
      dispatch({ type: 'SET_INPUT', field: 'joinInviteCode', value: '' });
      await fetchGroups();
    } catch (err: any) {
      dispatch({ type: 'SET_ACTION_STATE', status: 'error', message: err.message || 'Failed to join group.' });
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    ...state,
    dispatch,
    fetchGroups,
    handleCreateGroup,
    handleJoinGroup
  };
}
