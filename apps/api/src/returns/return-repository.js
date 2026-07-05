import { callRpc, selectOne, selectRows, updateRows, insertRow } from "../supabase.js";
import { RETURN_SELECT, TICKET_SELECT } from "./return-constants.js";
import { HttpError } from "../http.js";

export function createReturnRepository() {
  return {
    async listReturns(filters, accessToken) {
      const query = {
        select: RETURN_SELECT,
        order: "created_at.desc",
        limit: filters.limit,
        offset: filters.offset
      };
      if (filters.status) query.status = `eq.${filters.status}`;
      if (filters.search) query.or = `(description.ilike.*${filters.search}*)`;
      return selectRows("return_exchange", query, authOptions(accessToken));
    },

    async getReturn(returnId, accessToken) {
      return selectOne("return_exchange", {
        select: RETURN_SELECT,
        return_id: `eq.${returnId}`
      }, authOptions(accessToken));
    },

    async approveRefund(returnId, input, accessToken) {
      return callRpc("admin_approve_refund", {
        p_return_id: returnId,
        p_refund_amount: input.refundAmount,
        p_expected_version: input.expectedVersion,
        p_admin_note: input.adminNote || ""
      }, { accessToken });
    },

    async approveExchange(returnId, input, accessToken) {
      return callRpc("admin_approve_exchange", {
        p_return_id: returnId,
        p_expected_version: input.expectedVersion,
        p_admin_note: input.adminNote || ""
      }, { accessToken });
    },

    async reject(returnId, input, accessToken) {
      return callRpc("admin_reject_return", {
        p_return_id: returnId,
        p_reason: input.reason,
        p_expected_version: input.expectedVersion
      }, { accessToken });
    },

    async updateReturnStatus(returnId, input, actorId, actorRole, ipAddress) {
      const current = await selectOne("return_exchange", {
        select: RETURN_SELECT,
        return_id: `eq.${returnId}`
      });
      if (!current) {
        throw new HttpError(404, "RETURN_NOT_FOUND", "Return record not found");
      }
      if (current.version !== input.expectedVersion) {
        throw new HttpError(409, "VERSION_CONFLICT", "Return record has been modified by another user");
      }

      const payload = {
        status: input.status,
        version: current.version + 1,
        updated_at: new Date().toISOString()
      };
      if (input.adminNote !== undefined) payload.admin_note = input.adminNote;
      if (input.reason !== undefined) payload.rejection_reason = input.reason;
      if (input.refundAmount !== undefined && input.refundAmount !== null) payload.refund_amount = input.refundAmount;
      if (input.trackingReturnCode !== undefined) payload.tracking_return_code = input.trackingReturnCode;
      if (input.conditionCheckResult !== undefined) payload.condition_check_result = input.conditionCheckResult;
      if (input.imageProof !== undefined && input.imageProof !== null) {
        payload.evidence_images = [input.imageProof];
      }
      
      if (["completed", "rejected"].includes(input.status)) {
        payload.resolved_at = new Date().toISOString();
      }

      const rows = await updateRows("return_exchange", {
        return_id: `eq.${returnId}`,
        version: `eq.${input.expectedVersion}`
      }, payload);

      if (!rows.length) {
        throw new HttpError(409, "VERSION_CONFLICT", "Return record has been modified by another user or does not exist");
      }

      await insertRow("audit_log", {
        actor_id: actorId,
        actor_role: actorRole,
        action: `update_status_${input.status}`,
        module: "returns",
        target_id: returnId,
        old_value: { status: current.status, version: current.version },
        new_value: { status: rows[0].status, version: rows[0].version },
        ip_address: ipAddress || null,
        timestamp: new Date().toISOString()
      });

      return rows[0];
    },

    async listTickets(filters, accessToken) {
      const query = {
        select: TICKET_SELECT,
        order: "created_at.desc",
        limit: filters.limit,
        offset: filters.offset
      };
      if (filters.status) query.status = `eq.${filters.status}`;
      return selectRows("support_ticket", query, authOptions(accessToken));
    },

    async getTicket(ticketId, accessToken) {
      return selectOne("support_ticket", {
        select: TICKET_SELECT,
        ticket_id: `eq.${ticketId}`
      }, authOptions(accessToken));
    },

    async assignTicket(ticketId, input, accessToken) {
      return callRpc("admin_assign_ticket", {
        p_ticket_id: ticketId,
        p_assigned_to: input.assignedTo,
        p_expected_version: input.expectedVersion
      }, { accessToken });
    },

    async respondTicket(ticketId, input, accessToken) {
      return callRpc("admin_respond_ticket", {
        p_ticket_id: ticketId,
        p_response: input.response,
        p_expected_version: input.expectedVersion
      }, { accessToken });
    },

    async closeTicket(ticketId, input, accessToken) {
      return callRpc("admin_close_ticket", {
        p_ticket_id: ticketId,
        p_expected_version: input.expectedVersion,
        p_reason: input.reason || ""
      }, { accessToken });
    },

    async listAuditLogs(filters, accessToken) {
      const query = {
        select: "audit_id,actor_id,actor_role,action,module,target_id,old_value,new_value,ip_address,timestamp",
        order: "timestamp.desc",
        limit: filters.limit,
        offset: filters.offset,
        or: "(module.eq.returns,module.eq.support)"
      };
      if (filters.targetId) query.target_id = `eq.${filters.targetId}`;
      return selectRows("audit_log", query, authOptions(accessToken));
    }
  };
}

function authOptions(accessToken) {
  return { useAnonKey: true, accessToken };
}
