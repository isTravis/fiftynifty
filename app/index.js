import React from 'react';
import ReactDOM from 'react-dom';
import ga from 'react-ga';
import { Router, browserHistory, applyRouterMiddleware } from 'react-router';
import { useScroll } from 'react-router-scroll';
import { Provider } from 'react-redux';
import routes from './Routes';
import configureStore from './configureStore';

import fetch from 'isomorphic-fetch';

const store = configureStore();
if (window.location.hostname !== 'localhost') {
	ga.initialize('UA-91586776-1');
	Raven.config('https://554e59867e864ae48c5ab57899c8f0a5@sentry.io/140276').install()
}

if (/PhantomJS/.test(window.navigator.userAgent)) { require('es6-promise').polyfill(); }

function onRouteUpdate() {
	// Log Page View
	ga.set({ page: window.location.pathname });
	ga.pageview(window.location.pathname);

	// Smooth scroll if needed
	const { hash } = window.location;
	if (hash !== '') {
		// Push onto callback queue so it runs after the DOM is updated,
		// this is required when navigating from a different page so that
		// the element is rendered on the page before trying to getElementById.
		setTimeout(() => {
			const id = hash.replace('#', '');
			const element = document.getElementById(id);
			if (element) element.scrollIntoView();
		}, 0);
	}
}

global.clientFetch = function(route, opts) {
	return fetch(route, {
		...opts,
		credentials: 'same-origin'
	})
	.then((response)=> {
		if (!response.ok) { 
			return response.json().then(err => { throw err; });
		}
		return response.json();
	});
};

ReactDOM.render(
	<Provider store={store}>
		<Router 
			history={browserHistory} 
			routes={routes} 
			onUpdate={onRouteUpdate} 
			render={applyRouterMiddleware(useScroll((prevRouterProps, nextRouterProps) => {
				// Don't scroll if only the query is changing.
				if (prevRouterProps && prevRouterProps.location.pathname === nextRouterProps.location.pathname) {
					return false;
				}

				return true;
			}))} 
		/>
	</Provider>,
	document.getElementById('root')
);
