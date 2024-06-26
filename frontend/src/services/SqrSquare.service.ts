import RootService from "./Root.service";
import {makeAutoObservable} from "mobx";
import axios from "axios";
import {SqrSquareDto} from "../dtos/SqrSquare.dto";
import {SqrRoleDto} from "../dtos/SqrRole.dto";
import {SqrSquareUserDto} from "../dtos/SqrSquareUser.dto";
import {UFilterItem} from "../components/DevsGrid/DevsGridFilterItem";
import {SqrTeamDto} from "../dtos/SqrTeam.dto";
import {SqrSquareTeamUserDto} from "../dtos/SqrSquareTeamUserDto";
import {SqrTimerDto} from "../dtos/SqrTimer.dto";

export default class SqrSquareService {
    private readonly _rootService: RootService;
    private readonly _restPath: string;

    constructor(rootService: RootService) {
        this._rootService = rootService;
        this._restPath = `${rootService.restUrl}/sqr-square`;
        makeAutoObservable(this);
    }

    async getSquares(): Promise<SqrSquareDto[]> {
        return (await axios.get<SqrSquareDto[]>(`${this._restPath}`)).data;
    }

    async getSquare(id: SqrSquareDto['id']): Promise<SqrSquareDto> {
        return (await axios.get<SqrSquareDto>(`${this._restPath}/${id}`)).data;
    }

    async createSquare(sqrSquare: SqrSquareDto): Promise<SqrSquareDto> {
        return (await axios.post<SqrSquareDto>(`${this._restPath}`, sqrSquare)).data;
    }

    async editSquare(id: SqrSquareDto['id'], sqrSquare: SqrSquareDto): Promise<SqrSquareDto> {
        return (await axios.put<SqrSquareDto>(`${this._restPath}/${id}`, sqrSquare)).data;
    }

    async deleteSquares(ids: SqrSquareDto['id'][]): Promise<void> {
        await axios.delete(`${this._restPath}/${ids.join(',')}`);
    }

    async getSquareRoles(squareId: SqrSquareDto['id']): Promise<SqrRoleDto[]> {
        if (!squareId) {
            return [];
        }
        return (await axios.get<SqrRoleDto[]>(`${this._restPath}/${squareId}/sqr-role`)).data;
    }

    async getSquareRoleUsers(squareId: SqrSquareDto['id'], roleId: SqrRoleDto['id'], filters: {
        [p: string]: UFilterItem
    }, showAllUsers: boolean): Promise<SqrSquareUserDto[]> {
        if (!squareId || !roleId) {
            return [];
        }
        return (await axios.get<SqrSquareUserDto[]>(`${this._restPath}/${squareId}/sqr-role/${roleId}/user`, {
            params: {
                showAllUsers,
                fastFilter: filters['fast_filter']?.value !== undefined && filters['fast_filter']?.value !== '' ? filters['fast_filter'].value : undefined
            }
        })).data;
    }

    async addUsersToSquareRole(squareId: SqrSquareDto['id'],
                               userIds: SqrSquareUserDto['id'][],
                               roleIds: SqrRoleDto['id'][]): Promise<void> {
        await axios.post(`${this._restPath}/${squareId}/sqr-role/${roleIds.join(',')}/user/${userIds.join(',')}`, {});
    }

    async removeUsersFromSquareRole(squareId: SqrSquareDto['id'],
                                    userIds: SqrSquareUserDto['id'][],
                                    roleIds: SqrRoleDto['id'][]): Promise<void> {
        await axios.delete(`${this._restPath}/${squareId}/sqr-role/${roleIds.join(',')}/user/${userIds.join(',')}`, {});
    }

    async getSquareTeams(squareId: SqrSquareDto['id']): Promise<SqrTeamDto[]> {
        if (!squareId) {
            return [];
        }
        return (await axios.get<SqrTeamDto[]>(`${this._restPath}/${squareId}/sqr-team`)).data;
    }

    async getSquareTeam(squareId: SqrSquareDto['id'], teamId: SqrTeamDto['id']): Promise<SqrTeamDto> {
        return (await axios.get<SqrTeamDto>(`${this._restPath}/${squareId}/sqr-team/${teamId}`)).data;
    }

    async deleteTeams(squareId: SqrSquareDto['id'], teamIds: SqrTeamDto['id'][]): Promise<void> {
        await axios.delete<void>(`${this._restPath}/${squareId}/sqr-team/${teamIds.join(',')}`);
    }

    async createTeam(squareId: SqrSquareDto['id'], team: SqrTeamDto): Promise<SqrTeamDto> {
        return (await axios.post<SqrTeamDto>(`${this._restPath}/${squareId}/sqr-team`, team)).data;
    }

    async editTeam(squareId: SqrSquareDto['id'], teamId: SqrTeamDto['id'], team: SqrTeamDto): Promise<SqrTeamDto> {
        return (await axios.put<SqrTeamDto>(`${this._restPath}/${squareId}/sqr-team/${teamId}`, team)).data;
    }

    async getSquareTeamUsers(squareId: SqrSquareDto['id'],
                             teamId: SqrTeamDto['id'],
                             filters: {
                                 [p: string]: UFilterItem
                             },
                             showAllUsers: boolean): Promise<SqrSquareTeamUserDto[]> {
        if (!squareId || !teamId) {
            return [];
        }
        return (await axios.get<SqrSquareTeamUserDto[]>(`${this._restPath}/${squareId}/sqr-team/${teamId}/user`, {
            params: {
                showAllUsers,
                fastFilter: filters['fast_filter']?.value !== undefined && filters['fast_filter']?.value !== '' ? filters['fast_filter'].value : undefined
            }
        })).data;
    }

    async addUsersToSquareTeam(squareId: SqrSquareDto['id'],
                               userIds: SqrSquareTeamUserDto['id'][],
                               teamIds: SqrTeamDto['id'][]): Promise<void> {
        await axios.post(`${this._restPath}/${squareId}/sqr-team/${teamIds.join(',')}/user/${userIds.join(',')}`, {});
    }

    async removeUsersFromSquareTeam(squareId: SqrSquareDto['id'],
                                    userIds: SqrSquareTeamUserDto['id'][],
                                    teamIds: SqrTeamDto['id'][]): Promise<void> {
        await axios.delete(`${this._restPath}/${squareId}/sqr-team/${teamIds.join(',')}/user/${userIds.join(',')}`, {});
    }

    async getSquareTimers(squareId: SqrSquareDto['id']): Promise<SqrTimerDto[]> {
        return (await axios.get<SqrTimerDto[]>(`${this._restPath}/${squareId}/sqr-timer`)).data;
    }

    async recreateTimers(squareId: SqrSquareDto['id']): Promise<void> {
        await axios.post<void>(`${this._restPath}/${squareId}/sqr-timer/recreate`);
    }

    async setAllTimerCount(squareId: SqrSquareDto['id'], count: SqrTimerDto['count']): Promise<void> {
        await axios.patch<void>(`${this._restPath}/${squareId}/sqr-timer/set-count/${count}`);
    }

    async setTimerCount(squareId: SqrSquareDto['id'],
                        timerId: SqrTimerDto['id'],
                        count: SqrTimerDto['count']): Promise<void> {
        await axios.patch<void>(`${this._restPath}/${squareId}/sqr-timer/${timerId}/set-count/${count}`);
    }
}