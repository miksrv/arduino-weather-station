// actions are where most of the business logic takes place
// they are dispatched by views or by other actions
// there are 3 types of actions:
//  async thunks - when doing asynchronous business logic like accessing a service
//  sync thunks - when you have substantial business logic but it's not async
//  plain object actions - when you just send a plain action to the reducer

import * as types from './actionTypes'

const METEO_ENDPOINT = 'http://api.miksrv.ru'

export function fetchMeteoData() {
    return async(dispatch) => {
        try {
            const url = `${METEO_ENDPOINT}/api/get_summary`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            const payload = await response.json();

            dispatch({ type: types.GET_METEO_DATA, payload });
        } catch (error) {
            console.error(error)
        }
    }
}