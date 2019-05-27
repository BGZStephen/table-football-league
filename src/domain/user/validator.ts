import * as joi from 'joi';
import * as joiUtils from '../../utils/joi';
import { IUserCreateParams, IUserAuthenticationParams, IUserQuery } from './user';

class UserValidatorService {
  public validateNewUser(params: IUserCreateParams) {
    const schema = joi.object().keys(newUserConstraint);
  
    joiUtils.validateThrow(params, schema);
  }

  public validateAuthenticationCredentials(params: IUserAuthenticationParams) {
    const schema = joi.object().keys(authenticationCredentialConstraint);
  
    joiUtils.validateThrow(params, schema);
  }

  public validateListQuery(params: IUserQuery) {
    const schema = joi.object().keys(userListConstraint);
  
    joiUtils.validateThrow(params, schema);
  }
}

export const UserValidator = new UserValidatorService();

export const newUserConstraint = {
  firstName: joi.string().alphanum().required().label('First name'),
  lastName: joi.string().alphanum().required().label('Last name'),
  email: joi.string().email({ minDomainAtoms: 2 }).required().label('Email'),
  password: joi.string().required().label('Password'),
};

export const authenticationCredentialConstraint = {
  email: joi.string().email().required().label('Email'),
  password: joi.string().required().label('Password'),
};

export const userListConstraint = {
  _id: joi.string().alphanum().label('User IDs'),
  email: joi.string().email().label('Email address'),
};