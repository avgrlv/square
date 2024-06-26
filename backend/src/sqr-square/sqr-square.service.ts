import {Injectable} from '@nestjs/common';
import {DatabaseService} from '../services/database.service';
import {SqrSquareDto} from "../dtos/sqr-square.dto";
import {SqrRoleDto} from "../dtos/sqr-role.dto";
import {SqrSquareUserDto} from "../dtos/sqr-square-user.dto";
import {UserDto} from "../dtos/user.dto";
import {SqrTeamDto} from "../dtos/sqr-team.dto";
import {SqrSquareTeamUserDto} from "../dtos/sqr-square-team-user.dto";
import {SqrTimerDto} from "../dtos/sqr-timer.dto";
import {SqrTimerState, SqrTimerStateWithTitles} from "../dtos/sqr-timer-state";

@Injectable()
export class SqrSquareService {

    constructor(private databaseService: DatabaseService) {
    }

    async getSquares(user: UserDto): Promise<SqrSquareDto[]> {
        const dbData = await this.databaseService.sqr_square.findMany(
            {
                where: user.roles.includes('admin') ? undefined : {
                    sqr_square_user: {
                        some: {user_id: user.id}
                    }
                }
            }
        );
        return dbData.map<SqrSquareDto>(d => ({
            id: d.id.toNumber(),
            name: d.name,
            caption: d.caption,
            description: d.description,
        }));
    }

    async getSquare(id: SqrSquareDto['id']): Promise<SqrSquareDto> {
        const dbData = await this.databaseService.sqr_square.findFirst({where: {id}});
        return {
            id: dbData.id.toNumber(),
            name: dbData.name,
            caption: dbData.caption,
            description: dbData.description,
        };
    }

    async createSquare(admRole: SqrSquareDto): Promise<SqrSquareDto> {
        const dbResult = await this.databaseService.sqr_square.create({
            data: {
                name: admRole.name,
                caption: admRole.caption,
                description: admRole.description,
            },
        });
        return {
            id: dbResult.id.toNumber(),
            name: dbResult.name,
            caption: dbResult.caption,
            description: dbResult.description,
        };
    }

    async editSquare(id: SqrSquareDto['id'], admRole: SqrSquareDto): Promise<SqrSquareDto> {
        const dbResult = await this.databaseService.sqr_square.update({
            data: {
                name: admRole.name,
                caption: admRole.caption,
                description: admRole.description,
            },
            where: {id},
        });
        return {
            id: dbResult.id.toNumber(),
            name: dbResult.name,
            caption: dbResult.caption,
            description: dbResult.description,
        };
    }

    async deleteSquares(ids: SqrSquareDto['id'][]): Promise<void> {
        await this.databaseService.sqr_square.deleteMany({
            where: {
                id: {in: ids}
            },
        });
    }

    async getSquareRoles(): Promise<SqrRoleDto[]> {
        const dbData = await this.databaseService.sqr_role.findMany();
        return dbData.map<SqrRoleDto>(d => ({
            id: d.id.toNumber(),
            name: d.name,
            caption: d.caption,
            description: d.description,
            groupId: d.group_id.toNumber(),
        }));
    }

    async getSquareRoleUsers(squareId: SqrSquareDto['id'], roleId: SqrRoleDto['id'], fastFilter: string, showAllUsers: boolean = false): Promise<SqrSquareUserDto[]> {
        const dbData = await this.databaseService.adm_user.findMany({
            include: {sqr_square_user: {where: {square_id: squareId, role_id: roleId}}},
            where: {
                name: {not: 'admin'},
                sqr_square_user: !showAllUsers ? {some: {square_id: squareId, role_id: roleId}} : undefined,
                caption: (fastFilter ?? '').length > 0 ? {contains: fastFilter, mode: "insensitive"} : undefined
            }
        });
        return dbData.map<SqrSquareUserDto>(d => ({
            id: d.id.toNumber(),
            name: d.name,
            caption: d.caption,
            activeInSquareRole: d.sqr_square_user.findIndex(su => su.user_id.toNumber() === d.id.toNumber()) !== -1,
        }));
    }

    async addUsersToSquareRole(squareId: SqrSquareDto['id'], roleIds: SqrRoleDto['id'][], userIds: SqrSquareUserDto['id'][]): Promise<void> {
        const addSquareUserData = [];
        const addAdmUserGroupData = [];
        const roles = await this.databaseService.sqr_role.findMany({where: {id: {in: roleIds}}});
        for (const role of roles) {
            for (const userId of userIds) {
                addSquareUserData.push({
                    user_id: userId,
                    role_id: role.id,
                    square_id: squareId
                });
                addAdmUserGroupData.push({
                    user_id: userId,
                    group_id: role.group_id
                });
            }
        }
        await this.databaseService.sqr_square_user.createMany({
            data: addSquareUserData
        });
        await this.databaseService.adm_user_group.createMany({
            data: addAdmUserGroupData
        });
    }

    async removeUsersFromSquareRole(squareId: SqrSquareDto['id'], roleIds: SqrRoleDto['id'][], userIds: SqrSquareUserDto['id'][]): Promise<void> {
        const groupIds = await this.databaseService.sqr_role.findMany({
            select: {group_id: true},
            distinct: 'group_id',
            where: {id: {in: roleIds}}
        });
        await this.databaseService.sqr_square_user.deleteMany({
            where: {
                user_id: {in: userIds},
                role_id: {in: roleIds},
                square_id: squareId
            }
        });
        await this.databaseService.adm_user_group.deleteMany({
            where: {
                user_id: {in: userIds},
                group_id: {in: groupIds.map(g => g.group_id)},
            }
        })
    }

    async getSquareTeams(squareId: SqrSquareDto['id']): Promise<SqrTeamDto[]> {
        const dbData = await this.databaseService.sqr_square_team.findMany({where: {square_id: squareId}});
        return dbData.map<SqrTeamDto>(d => ({
            id: d.id.toNumber(),
            squareId: d.square_id.toNumber(),
            name: d.name,
            caption: d.caption,
            description: d.description,
        }));
    }

    async getSquareTeam(squareId: SqrSquareDto['id'], teamId: SqrTeamDto['id']): Promise<SqrTeamDto> {
        const dbData = await this.databaseService.sqr_square_team.findFirst({where: {square_id: squareId, id: teamId}});
        return {
            id: dbData.id.toNumber(),
            squareId: dbData.square_id.toNumber(),
            name: dbData.name,
            caption: dbData.caption,
            description: dbData.description,
        }
    }

    async createSquareTeam(squareId: SqrSquareDto['id'], team: SqrTeamDto): Promise<SqrTeamDto> {
        const dbData = await this.databaseService.sqr_square_team.create({
            data: {
                square_id: squareId,
                name: team.name,
                caption: team.caption,
                description: team.description
            }
        })
        return {
            id: dbData.id.toNumber(),
            squareId: dbData.square_id.toNumber(),
            name: dbData.name,
            caption: dbData.caption,
            description: dbData.description,
        };
    }

    async editSquareTeam(squareId: SqrSquareDto['id'], teamId: SqrTeamDto['id'], team: SqrTeamDto): Promise<SqrTeamDto> {
        const dbData = await this.databaseService.sqr_square_team.update({
            where: {id: teamId},
            data: {
                name: team.name,
                caption: team.caption,
                description: team.description
            }
        })
        return {
            id: dbData.id.toNumber(),
            squareId: dbData.square_id.toNumber(),
            name: dbData.name,
            caption: dbData.caption,
            description: dbData.description,
        };
    }

    async deleteSquareTeams(squareId: SqrSquareDto['id'], teamIds: SqrTeamDto['id'][]): Promise<void> {
        await this.databaseService.sqr_square_team.deleteMany({where: {square_id: squareId, id: {in: teamIds}}});
    }

    async getSquareTeamUsers(squareId: SqrSquareDto['id'],
                             teamId: SqrTeamDto['id'],
                             showAllUsers: boolean,
                             fastFilter: string,
    ): Promise<SqrSquareTeamUserDto[]> {
        const dbData = await this.databaseService.sqr_square_user.findMany({
            include: {
                adm_user: true,
                sqr_square_team: true,
                sqr_role: true,
            },
            where: {
                square_id: squareId,
                sqr_role: {name: {in: ['participant', 'teamExpert']}},
                team_id: !showAllUsers ? teamId : undefined,
                adm_user: (fastFilter ?? '').length > 0 ? {
                    caption: {
                        contains: fastFilter,
                        mode: "insensitive"
                    }
                } : undefined
            }
        });
        return dbData.map<SqrSquareTeamUserDto>(d => ({
            id: d.id.toNumber(),
            team: {
                id: d.sqr_square_team?.id.toNumber(),
                name: d.sqr_square_team?.name,
                caption: d.sqr_square_team?.caption,
                description: d.sqr_square_team?.description,
                squareId: d.sqr_square_team?.square_id.toNumber()
            },
            role: {
                id: d.sqr_role?.id.toNumber(),
                name: d.sqr_role?.name,
                caption: d.sqr_role?.caption,
                description: d.sqr_role?.description,
            },
            user: {
                id: d.adm_user.id.toNumber(),
                name: d.adm_user.name,
                caption: d.adm_user.caption,
                activeInSquareRole: d.team_id?.toNumber() === teamId
            }
        }));
    }

    async addUsersToSquareTeams(squareId: SqrSquareDto['id'], teamIds: SqrTeamDto['id'][], userIds: SqrSquareUserDto['id'][]): Promise<void> {
        await Promise.all(teamIds.map(teamId => this.databaseService.sqr_square_user.updateMany({
            where: {
                square_id: squareId,
                id: {in: userIds},
            },
            data: {team_id: teamId}
        })));
    }

    async removeUsersFromSquareTeams(squareId: SqrSquareDto['id'], teamIds: SqrTeamDto['id'][], userIds: SqrSquareUserDto['id'][]): Promise<void> {
        await this.databaseService.sqr_square_user.updateMany({
            where: {
                square_id: squareId,
                id: {in: userIds},
                team_id: {in: teamIds}
            },
            data: {team_id: null}
        });
    }

    async getSquareTimers(squareId: SqrSquareDto['id']): Promise<SqrTimerDto[]> {
        const dbData = await this.databaseService.sqr_square_timer.findMany({where: {square_id: squareId}});
        return dbData.map((rec) => ({
            id: rec.id.toNumber(),
            squareId: rec.square_id.toNumber(),
            teamId: rec.team_id.toNumber(),
            caption: rec.caption,
            state: {key: rec.state, value: SqrTimerStateWithTitles[<SqrTimerState>rec.state]},
            count: Number(rec.count),
            beginTime: rec.begin_time,
            pauseTime: rec.pause_time,
            continueTime: rec.continue_time,
            stopTime: rec.stop_time,
            countLeft: 15 // Сумма значения к дате старта + все значения count пауз из detail
        }));
    }

    async recreateSquareTimers(squareId: SqrSquareDto['id']): Promise<void> {
        await this.databaseService.$transaction(async (prisma) => {
            await prisma.sqr_square_timer.deleteMany({where: {square_id: squareId}});
            const teams = await this.getSquareTeams(squareId);
            for (const team of teams) {
                await prisma.sqr_square_timer.create({
                    data: {
                        square_id: squareId,
                        team_id: team.id,
                        caption: team.caption,
                        sqr_square_timer_detail: {
                            create: {
                                state: 'READY',
                                time: new Date(),
                                description: 'Пересоздание таймеров команд'
                            }
                        }
                    },
                });
            }
        });
    }

    async setTimerCount(squareId: SqrSquareDto['id'],
                        count: SqrTimerDto['count'],
                        timerId?: SqrTimerDto['id']): Promise<void> {
        await this.databaseService.sqr_square_timer.updateMany({
            where: {square_id: squareId, id: timerId},
            data: {count: count}
        });
    }
}
