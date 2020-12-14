import { useState, useEffect, useReducer } from 'react';
import { keysToCamel } from './helpers';

const dataFetchReducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_INIT':
            return {
                ...state,
                isLoading: true,
                isSuccess: false,
                error: null
            };
        case 'FETCH_SUCCESS':
            return {
                ...state,
                isLoading: false,
                isSuccess: true,
                error: null,
                data: action.payload
            };
        case 'FETCH_FAILURE':
            return {
                ...state,
                isLoading: false,
                isSuccess: false,
                error: action.payload
            };
        default:
            throw new Error();
    }
};

const useApi = (initialData, postprocess = d => d) => {
    const [ url, setUrl ] = useState(null);

    const [ state, dispatch ] = useReducer(dataFetchReducer, {
        isLoading: false,
        isSuccess: false,
        error: null,
        data: initialData
    });

    useEffect(() => {
        // Prevent fetching nothing
        if (!url) {
            return;
        }

        // Initialize
        let didCancel = false;
        dispatch({ type: 'FETCH_INIT' });

        // Fetching
        window.insights.chrome.auth.getUser().then(() => Promise.all(
            Array.isArray(url) ? url : [ url ]
        ).then(data => {
            if (!didCancel) {
                dispatch({
                    type: 'FETCH_SUCCESS',
                    payload: postprocess( // Apply the postprocess function.
                        keysToCamel(
                            // If single url give return a single object instead of array.
                            Array.isArray(url) ? data : data[0]
                        )
                    )
                });
            }
        }).catch(e => {
            if (!didCancel) {
                dispatch({ type: 'FETCH_FAILURE', payload: e.error });
            }
        }));

        return () => { didCancel = true; };
    }, [ url ]);

    return [ state, setUrl ];
};

export default useApi;
