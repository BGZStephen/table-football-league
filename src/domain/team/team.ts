import * as _ from "lodash"
import { TeamValidator } from "./validator";
import { ITeam, TeamModel } from "../../models/team";
import { HTTPError } from "../errors/http-error";

export interface ITeamCreateParams {
  name: string;
  userIds: string[];
}

export interface ITeamQuery {
  _id: string;
  userId: string;
  excludeUserId: string;
  name: string;
  populate: string;
  sort: string;
  limit: number;
  offset: number;
}

export interface ITeamGetQuery {
  id: string;
}

class TeamDomainHelper {
  private team: ITeam;

  constructor(team: ITeam) {
    this.team = team;
  }

  public get() {
    this.hasTeam("get");
    return this.team;
  }

  public async save() {
    this.hasTeam("save");
    await this.team.save();
  }

  private hasTeam(callingFunctionName: string) {
    if (!this.team) {
      throw new Error(`A Team has to be set for this function (${callingFunctionName}) to be called`)
    }
  }

  public clear() {
    this.team = undefined;
  }

  public getPublicFields() {
    this.hasTeam("getPublicFields");
    return this.team;
  }

  static async create(params: ITeamCreateParams) {
    TeamValidator.validateNewTeam(params);

    const teamMatchingName = await TeamModel.findOne({name: params.name});

    if (teamMatchingName) {
      throw HTTPError("A team with that name already exists", 400);
    }

    const team = await TeamModel.create(_.pick(params, ['name', 'userIds']));
  
    return new TeamDomainHelper(team)
  }

  static async getById(params: ITeamGetQuery) {
    TeamValidator.validateGetRequest(params);

    const team = await TeamModel.findOne({_id: params.id}).populate("users");

    if (!team) {
      throw HTTPError("Team not found", 404)
    }

    return new TeamDomainHelper(team);
  }

  static async list(query: ITeamQuery) {
    TeamValidator.validateListQuery(query);

    const dbQuery: any = {};
    const dbSort: any = {};
    const dbFields: any = {};
    const dbFilter: any = {
      limit: query.limit || 20,
      skip: query.offset || 0,
    }

    let populators = "";

    if (query._id) {
      dbQuery._id = {$in: query._id.split(',')}
    }

    if (query.userId) {
      dbQuery.userIds = {$in: query.userId.split(',')}
    }

    if (query.excludeUserId) {
      dbQuery.userIds = {$nin: query.excludeUserId.split(',')}
    }

    if (query.name) {
      const nameRegexp = new RegExp(query.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'gi');

      dbQuery.name = nameRegexp;
    }

    if (query.sort) {
      const sortKey = query.sort.startsWith('-') ? query.sort.substr(1, query.sort.length) : query.sort;
      dbSort[sortKey] = query.sort.startsWith('-') ? 'desc' : 'asc';
    }

    if (query.populate) {
      populators = query.populate;
    }

    const results = await TeamModel.find(dbQuery, dbFields, dbFilter).populate(populators).sort(query.sort ? dbSort : null);

    const totalCount = await TeamModel.count({});

    const response = {
      count: results.length,
      totalCount,
      data: results,
    }

    return response;
  }
}

export const Team = TeamDomainHelper;