/**
 * Auto Clock Service - Automatic Clock-In/Out Logic
 * 
 * Handles attendance tracking without GPS/Geofencing as per new requirements.
 */

import prisma from '../prisma';
import { startOfDay } from 'date-fns';

/**
 * Clock in an employee
 * @param {string} employeId - Employee ID
 * @returns {object} Clock-in result
 */
export async function autoClockIn(employeId) {
    try {

        // Check if already clocked in today
        const today = startOfDay(new Date());
        const existingPointage = await prisma.pointage.findFirst({
            where: {
                employeId,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        const now = new Date();

        if (existingPointage) {
            // Update existing pointage if it doesn't have a clock-in time
            if (existingPointage.clockInTime && !existingPointage.clockOutTime) {
                return {
                    success: false,
                    error: 'ALREADY_CLOCKED_IN',
                    message: `Vous êtes déjà pointé depuis ${existingPointage.clockInTime.toLocaleTimeString('fr-FR')}.`,
                    pointage: existingPointage
                };
            }

            const updated = await prisma.pointage.update({
                where: { id: existingPointage.id },
                data: {
                    clockInTime: now,
                    clockOutTime: null,
                    statut: 'PRESENT',
                    isAutoClockIn: false
                }
            });

            return {
                success: true,
                message: `Bienvenue ! Pointage entrée enregistré à ${now.toLocaleTimeString('fr-FR')}.`,
                pointage: updated
            };
        }

        // Create new pointage
        const pointage = await prisma.pointage.create({
            data: {
                employeId,
                date: today,
                statut: 'PRESENT',
                clockInTime: now,
                isAutoClockIn: false,
                joursTravailles: 1
            }
        });

        return {
            success: true,
            message: `Bienvenue ! Pointage enregistré à ${now.toLocaleTimeString('fr-FR')}.`,
            pointage
        };

    } catch (error) {
        console.error('Error in autoClockIn:', error);
        return {
            success: false,
            error: 'SERVER_ERROR',
            message: 'Erreur lors du pointage.',
            details: error.message
        };
    }
}

/**
 * Clock out an employee
 * @param {string} employeId - Employee ID
 * @returns {object} Clock-out result
 */
export async function clockOut(employeId) {
    try {
        const today = startOfDay(new Date());
        const pointage = await prisma.pointage.findFirst({
            where: {
                employeId,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                },
                clockInTime: { not: null },
                clockOutTime: null
            }
        });

        if (!pointage) {
            return {
                success: false,
                error: 'NOT_CLOCKED_IN',
                message: 'Vous n\'êtes pas actuellement pointé.'
            };
        }

        const now = new Date();
        const clockInTime = new Date(pointage.clockInTime);
        const hoursWorked = (now - clockInTime) / (1000 * 60 * 60);

        // Calculate overtime (assuming 8-hour workday)
        const regularHours = 8;
        const overtimeHours = Math.max(0, hoursWorked - regularHours);

        const updated = await prisma.pointage.update({
            where: { id: pointage.id },
            data: {
                clockOutTime: now,
                totalHours: Math.round(hoursWorked * 100) / 100,
                heuresSupp: Math.round(overtimeHours * 100) / 100,
                isAutoClockOut: false
            }
        });

        return {
            success: true,
            message: `Sortie enregistrée. Total: ${Math.round(hoursWorked * 10) / 10}h travaillées.`,
            pointage: updated,
            hoursWorked: Math.round(hoursWorked * 10) / 10
        };

    } catch (error) {
        console.error('Error in clockOut:', error);
        return {
            success: false,
            error: 'SERVER_ERROR',
            message: 'Erreur lors de la déconnexion.',
            details: error.message
        };
    }
}

/**
 * Get current clock-in status for an employee
 * @param {string} employeId - Employee ID
 * @returns {object} Status information
 */
export async function getClockInStatus(employeId) {
    try {
        const today = startOfDay(new Date());
        const pointage = await prisma.pointage.findFirst({
            where: {
                employeId,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: {
                employe: {
                    select: {
                        nom: true,
                        prenom: true,
                        poste: true
                    }
                }
            }
        });

        if (!pointage || !pointage.clockInTime) {
            return {
                isClockedIn: false,
                message: 'Non pointé aujourd\'hui'
            };
        }

        const now = new Date();
        const clockInTime = new Date(pointage.clockInTime);
        const hoursWorked = pointage.clockOutTime
            ? pointage.totalHours
            : (now - clockInTime) / (1000 * 60 * 60);

        return {
            isClockedIn: !pointage.clockOutTime,
            clockInTime: pointage.clockInTime,
            clockOutTime: pointage.clockOutTime,
            hoursWorked: Math.round(hoursWorked * 10) / 10,
            pointage,
            employe: pointage.employe
        };

    } catch (error) {
        console.error('Error in getClockInStatus:', error);
        return {
            isClockedIn: false,
            error: error.message
        };
    }
}

