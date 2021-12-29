const initialState = {
	isNotificationVisible: false,
	notificationText: 'text',
	color: 'success',
}

export const state = () => ({ ...initialState })

export const mutations = {
	setNotification (state, update) {
		Object.assign(state, update)
	},
	setVisibility (state, isNotificationVisible) {
		Object.assign(state, {
			isNotificationVisible,
		})
	},
}

export const actions = {
	notify ({ commit }, notificationText) {
		commit('setNotification', {
			isNotificationVisible: true,
			color: 'success',
			notificationText,
		})
	},
	notifyError ({ commit }, notificationText) {
		commit('setNotification', {
			isNotificationVisible: true,
			color: 'error',
			notificationText,
		})
	},
	setVisibility ({ commit }, val) {
		commit('setVisibility', val)
	},
}
