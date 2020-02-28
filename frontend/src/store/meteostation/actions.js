// actions are where most of the business logic takes place
// they are dispatched by views or by other actions
// there are 3 types of actions:
//  async thunks - when doing asynchronous business logic like accessing a service
//  sync thunks - when you have substantial business logic but it's not async
//  plain object actions - when you just send a plain action to the reducer

import * as types from './actionTypes';

// import redditService from '../../services/reddit';

export function fetchMeteoData() {
    return async(dispatch, getState) => {
        try {
            // const subredditArray = await redditService.getDefaultSubreddits();
            // const topicsByUrl = _.keyBy(subredditArray, (subreddit) => subreddit.url);

            const payload = {
                temp: 16.4,
                humd: 78.23
            }

            dispatch({ type: types.GET_METEO_DATA, payload });
        } catch (error) {
            console.error(error);
        }
    }
}