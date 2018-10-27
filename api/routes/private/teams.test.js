const {doMock} = require('../../../tests/jest-utils');
const ObjectId = require('mongoose').Types.ObjectId;

doMock('api/utils/rest');
doMock('validate.js');

doMock('mongoose', () => {
  const Team = {
    save: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn()
  };

  const Player = {
    findById: jest.fn(),
  };

  return {
    Types: {
      ObjectId,
    },
    model(modelName) {
      return {Team, Player}[modelName];
    },
  };
});

beforeEach(() => {
  jest.resetAllMocks();
});

const teams = require('./teams');

describe('teams', () => {
  describe('updateOne()', () => {
    test('fails to update a team because of insufficient teams', async () => {
      const req = {
        context: {
          team: {}
        },

        body: {
          players: [],
        }
      }

      const res = {
        json: jest.fn(),
        error: jest.fn()
      }

      await teams.__updateOne(req, res);
      expect(res.error).toHaveBeenCalledWith({message: 'Teams require at least 2 players', statusCode: 400});
    })

    test('updates a team name', async () => {
      const saveFunction = function() {}
      const req = {
        context: {
          team: {
            name: 'WRIGGLE UNITED',
            save: jest.fn().mockReturnValue(saveFunction)
          }
        },

        body: {
          name: 'WRIGGLE FC'
        }
      }

      const res = {
        json: jest.fn(),
        error: jest.fn()
      }

      await teams.__updateOne(req, res);
      expect(req.context.team.name).toEqual('WRIGGLE FC')
      expect(res.json).toHaveBeenCalledTimes(1);
    })

    test('fails to update a team as one / multiple players cannot be found', async () => {
      const saveFunction = function() {}
      const req = {
        context: {
          team: {
            name: 'WRIGGLE UNITED',
            players: ['112233445566', '223344556677'],
            save: jest.fn().mockReturnValue(saveFunction)
          }
        },

        body: {
          players: ['334455667788', '445566778899'],
        }
      }

      require('mongoose').model('Player').findById.mockResolvedValue(null)

      const res = {
        json: jest.fn(),
        error: jest.fn()
      }

      await teams.__updateOne(req, res);
      expect(res.error).toHaveBeenCalledWith({message: 'Player not found', statusCode: 403});
    })

    test('updates a team players', async () => {
      const saveFunction = function() {}
      const req = {
        context: {
          team: {
            name: 'WRIGGLE UNITED',
            players: ['112233445566', '223344556677'],
            save: jest.fn().mockReturnValue(saveFunction)
          }
        },

        body: {
          players: ['334455667788', '445566778899'],
        }
      }

      require('mongoose').model('Player').findById.mockResolvedValue({
        _id: '334455667788'
      })

      const res = {
        json: jest.fn(),
        error: jest.fn()
      }

      await teams.__updateOne(req, res);
      expect(req.context.team.players).toEqual(['334455667788', '445566778899'])
      expect(res.json).toHaveBeenCalledTimes(1);
    })
  })

  describe('search()', () => {
    test('returns search results', async () => {
      const req = {
        query: {},
      }

      const res = {
        json: jest.fn(),
        error: jest.fn()
      }

      require('mongoose')
      .model('Team')
      .find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([{name: 'WRIGGLE UTD'}])
      })

      await teams.__search(req, res);
      expect(res.json).toHaveBeenCalledWith([{name: 'WRIGGLE UTD'}]);
    })

    test('returns search results filtered by team name', async () => {
      const req = {
        query: {
          name: 'WRIGGLE FC',
        },
      }

      const res = {
        json: jest.fn(),
        error: jest.fn()
      }

      require('mongoose')
      .model('Team')
      .find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([{name: 'WRIGGLE FC'}])
      })

      await teams.__search(req, res);
      expect(res.json).toHaveBeenCalledWith([{name: 'WRIGGLE FC'}]);
    })

    test('returns search results with populators', async () => {
      const req = {
        query: {
          players: true,
        },
      }

      const res = {
        json: jest.fn(),
        error: jest.fn()
      }

      require('mongoose')
      .model('Team')
      .find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([{name: 'WRIGGLE UTD', players: [{firstName: 'stephen'}, {firstName: 'lydia'}]}])
      })

      await teams.__search(req, res);
      expect(res.json).toHaveBeenCalledWith([{name: 'WRIGGLE UTD', players: [{firstName: 'stephen'}, {firstName: 'lydia'}]}]);
    })
  })

  describe('search()', () => {
    test('returns a loaded team', async () => {
      const req = {
        context: {
          team: {
            name: 'WRIGGLE FC'
          },
        },
        query: {}
      }

      const res = {
        json: jest.fn(),
      }

      await teams.__getOne(req, res);
      expect(res.json).toHaveBeenCalledWith({
        name: 'WRIGGLE FC',
      })
    })

    test('returns a populated loaded team', async () => {
      const req = {
        context: {
          team: {
            name: 'WRIGGLE FC',
            players: ['112233445566', '223344556677'],
            populate: jest.fn().mockReturnThis(),
            execPopulate: jest.fn().mockResolvedValue({}),
          },
        },
        query: {
          players: true,
        }
      }

      const res = {
        json: jest.fn(),
      }

      await teams.__getOne(req, res);
      expect(req.context.team.execPopulate).toHaveBeenCalledTimes(1)
      expect(res.json).toHaveBeenCalledTimes(1)
    })
  })

  describe('load()', () => {
    test('fails to load a team due to a missing teamID', async () => {
      const req = {
        body: {},
        params: {},
      }

      const res = {
        json: jest.fn(),
        error: jest.fn(),
      }

      await teams.__load(req, res);
      expect(res.error).toHaveBeenCalledWith({statusCode: 400, message: 'TeamID is required'})
    })

    test('fails to load as user not found', async () => {
      const req = {
        body: {
          id: '665544332211'
        },
        params: {},
      }

      const res = {
        json: jest.fn(),
        error: jest.fn(),
      }

      require('mongoose').model('Team').findById.mockResolvedValue(null)

      await teams.__load(req, res);
      expect(res.error).toHaveBeenCalledWith({statusCode: 404, message: 'Team not found'})
    })

    test('loads a user into context', async () => {
      const req = {
        body: {
          id: '112233445566'
        },
        params: {},
        context: {},
      }
  
      const res = {
        json: jest.fn(),
        error: jest.fn(),
      }
  
      const next = jest.fn();
  
      require('mongoose').model('Team').findById.mockResolvedValue({
        id: '112233445566',
        name: 'WRIGGLE FC'
      })
  
      await teams.__load(req, res, next);
      expect(req.context.team).toEqual({
        id: '112233445566',
        name: 'WRIGGLE FC'
      })
      expect(next).toHaveBeenCalledTimes(1);
    })
  })

  describe('create()', () => {
    test('fails creation due to missing team name', async () => {
      const req = {};
      const res = {
        json: jest.fn(),
        error: jest.fn(),
      };
      require('validate.js').mockReturnValue('Team name is required')

      await teams.__create(req, res)
      expect(res.error).toHaveBeenCalledWith({message: 'Team name is required', statusCode: 400})
    })

    test('fails creation due to insufficient players', async () => {
      const req = {
        body: {
          players: []
        }
      };
      const res = {
        json: jest.fn(),
        error: jest.fn(),
      };
      require('validate.js').mockReturnValue(null)

      await teams.__create(req, res)
      expect(res.error).toHaveBeenCalledWith({message: 'Teams require at least 2 players', statusCode: 400})
    })

    test('fails creation due to inability to find player(s)', async () => {
      const req = {
        body: {
          players: ['998877665544', '887766554433']
        }
      };
      const res = {
        json: jest.fn(),
        error: jest.fn(),
      };
      require('validate.js').mockReturnValue(null)
      require('mongoose').model('Player').findById.mockResolvedValue(null)

      await teams.__create(req, res)
      expect(res.error).toHaveBeenCalledWith({message: 'Player not found', statusCode: 400})
    })

    test('fails creation due to inability to find player(s)', async () => {
      const req = {
        body: {
          players: ['998877665544', '887766554433'],
          name: 'WRIGGLE FC'
        }
      };
      const res = {
        json: jest.fn(),
        error: jest.fn(),
      };
      require('validate.js').mockReturnValue(null)
      require('mongoose').model('Player').findById.mockResolvedValue({_id: '887766554433'})
      require('mongoose').model('Team').create.mockResolvedValue({
        name: 'WRIGGLE FC',
        players: ['998877665544', '887766554433']
      })

      await teams.__create(req, res)
      expect(res.json).toHaveBeenCalledWith({
        name: 'WRIGGLE FC',
        players: ['998877665544', '887766554433']
      })
    })
  })
})