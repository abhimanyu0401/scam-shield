import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyCircleMembership } from "@/lib/auth/verify-circle-membership";
import { Redis } from "@upstash/redis";
import { notifyCircleMembers } from "@/lib/notifications/create";

const redis = new Redis({
  url: process.env.REDIS_KV_REST_API_URL!,
  token: process.env.REDIS_KV_REST_API_TOKEN!,
});

export interface CircleMemberItem {
  id: string;
  userId: string;
  role: "admin" | "member";
  displayName: string;
  joinedAt: string;
  isCurrentUser: boolean;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  try {
    const { circleId } = await params;

    // 1. Authenticate user and verify membership
    const auth = await verifyCircleMembership(circleId);
    if (!auth.success) {
      return auth.errorResponse;
    }

    const currentUserId = auth.user.id;
    const supabase = await createClient();

    // 2. Fetch all members of this group
    const { data: memberRows, error: memberError } = await supabase
      .from("group_members")
      .select("group_id, user_id, role, joined_at")
      .eq("group_id", auth.circleId);

    if (memberError) {
      console.error("Failed to fetch group members:", memberError);
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    const userIds = (memberRows || []).map((m) => m.user_id);

    // 3. Fetch display names from profiles table
    const profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        for (const p of profiles || []) {
          if (p.id && p.display_name) {
            profileMap[p.id] = p.display_name;
          }
        }
      } catch (err) {
        console.warn("Could not load profiles for members:", err);
      }
    }

    // 4. Format members list
    const members: CircleMemberItem[] = (memberRows || []).map((row, index) => {
      const isMe = row.user_id === currentUserId;
      let name = profileMap[row.user_id];
      if (!name) {
        name = isMe
          ? auth.user.user_metadata?.display_name || auth.user.email?.split("@")[0] || "You"
          : `Member ${index + 1}`;
      }

      let joinedAtStr = "";
      if (row.joined_at) {
        try {
          const parsedDate = new Date(row.joined_at);
          if (!isNaN(parsedDate.getTime())) {
            joinedAtStr = parsedDate.toISOString();
          }
        } catch {
          joinedAtStr = "";
        }
      }

      return {
        id: `${row.group_id}-${row.user_id}`,
        userId: row.user_id,
        role: (row.role || "member") as "admin" | "member",
        displayName: name,
        joinedAt: joinedAtStr,
        isCurrentUser: isMe,
      };
    });

    return NextResponse.json({ members });
  } catch (err: any) {
    console.error("Unexpected error in members API:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  try {
    const { circleId } = await params;

    // 1. Authenticate user and verify membership
    const auth = await verifyCircleMembership(circleId);
    if (!auth.success) {
      return auth.errorResponse;
    }

    const currentUserId = auth.user.id;
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.targetUserId || currentUserId;

    const supabase = await createClient();

    // 2. Fetch role of caller in this circle
    const { data: callerMember } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", auth.circleId)
      .eq("user_id", currentUserId)
      .single();

    const isCallerAdmin = callerMember?.role === "admin";

    // 3. Handle Self-Exit vs Admin-Removal
    if (targetUserId === currentUserId) {
      // Self Exit: Only for regular members, not admin
      if (isCallerAdmin) {
        return NextResponse.json(
          { error: "Admins cannot exit the circle directly. Please transfer admin rights first." },
          { status: 403 }
        );
      }
    } else {
      // Removing another user: Caller MUST be an admin
      if (!isCallerAdmin) {
        return NextResponse.json(
          { error: "Only circle admins can remove members." },
          { status: 403 }
        );
      }

      // Check target member's role: Admins CANNOT be removed
      const { data: targetMember } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", auth.circleId)
        .eq("user_id", targetUserId)
        .single();

      if (targetMember?.role === "admin") {
        return NextResponse.json(
          { error: "Circle admins cannot be removed." },
          { status: 403 }
        );
      }
    }

    // 4. Resolve target user display name before deleting
    let targetName = "A member";
    try {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", targetUserId)
        .single();
      if (targetProfile?.display_name) {
        targetName = targetProfile.display_name;
      }
    } catch {}

    // 5. Delete member from Supabase group_members
    const { error: deleteError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", auth.circleId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error("Failed to remove group member:", deleteError);
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    // 6. Record MEMBER_LEFT activity event at the source
    try {
      const leaveMessage =
        targetUserId === currentUserId
          ? `${targetName} left the circle`
          : `${targetName} was removed from the circle`;

      const eventItem = {
        id: `act-left-${targetUserId}-${Date.now()}`,
        circleId: auth.circleId,
        type: "MEMBER_LEFT",
        actorId: currentUserId,
        actorName: targetName,
        message: leaveMessage,
        timestamp: new Date().toISOString(),
      };

      await redis.lpush(`circle:activity:${auth.circleId}`, JSON.stringify(eventItem));
      await redis.ltrim(`circle:activity:${auth.circleId}`, 0, 99);

      // MEMBER_LEFT notification — notify remaining members (awaited)
      try {
        const { data: circleRow } = await supabase
          .from("groups")
          .select("name")
          .eq("id", auth.circleId)
          .single();
        const circleName = circleRow?.name ?? "your Circle";

        // Exclude the removed user from notifications
        // Unique per recipient: MEMBER_LEFT:<circleId>:<removedUserId>:<recipientId>
        await notifyCircleMembers(
          auth.circleId,
          targetUserId,
          "MEMBER_LEFT",
          "Member left",
          `${targetName} left ${circleName}.`,
          {
            actor_id: currentUserId,
            event_key_prefix: `MEMBER_LEFT:${auth.circleId}:${targetUserId}`,
          },
          supabase
        );
      } catch (notifErr) {
        console.error("[Notifications] MEMBER_LEFT notification failed (non-fatal):", notifErr);
      }
    } catch (actErr) {
      console.warn("Failed to log MEMBER_LEFT activity:", actErr);
    }

    return NextResponse.json({ success: true, removedUserId: targetUserId });
  } catch (err: any) {
    console.error("Unexpected error in remove member API:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
