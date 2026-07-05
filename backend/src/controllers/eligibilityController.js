import { eligibilityService } from '../services/eligibilityService.js';
import { ok } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';

const ROOM_TYPES = ['General', 'Semi-Private', 'Private', 'Single AC', 'Deluxe', 'Suite', 'ICU'];

export const eligibilityController = {
  async check(req, res) {
    const b = req.body || {};
    if (!b.policyId) throw new AppError('Policy is required', 400, 'POLICY_REQUIRED');
    if (!b.procedure || !b.procedure.trim()) throw new AppError('Procedure / diagnosis is required', 400, 'PROCEDURE_REQUIRED');
    if (b.claimedAmount == null || Number(b.claimedAmount) <= 0) throw new AppError('Total claimed amount is required', 400, 'AMOUNT_REQUIRED');
    if (b.roomType && !ROOM_TYPES.includes(b.roomType)) throw new AppError('Invalid room type', 400, 'INVALID_ROOM_TYPE', { allowed: ROOM_TYPES });

    const caseInput = {
      patientName: b.patientName,
      patientAge: Number(b.patientAge) || 0,
      roomType: b.roomType,
      roomCostPerDay: Number(b.roomCostPerDay) || 0,
      stayDays: Number(b.stayDays) || 0,
      admissionType: b.admissionType,
      procedure: b.procedure.trim(),
      procedureCost: Number(b.procedureCost) || 0,
      preExisting: b.preExisting,
      hospitalName: b.hospitalName,
      city: b.city,
      claimedAmount: Number(b.claimedAmount),
      policyAgeMonths: b.policyAgeMonths != null ? Number(b.policyAgeMonths) : undefined,
    };

    const result = await eligibilityService.check({ userId: req.user.id, policyId: b.policyId, caseInput });
    return ok(res, result, 'Eligibility checked');
  },

  async history(req, res) {
    const checks = await eligibilityService.history(req.user.id);
    return ok(res, { checks }, 'OK');
  },

  async get(req, res) {
    const check = await eligibilityService.get(req.params.id, req.user.id);
    return ok(res, { check }, 'OK');
  },
};
