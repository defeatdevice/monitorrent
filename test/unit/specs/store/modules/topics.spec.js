import * as api from 'src/api/monitorrent'
import store from 'src/store/modules/topics'
import types from 'src/store/types'
import { smartFilter, smartOrder } from 'src/store/modules/filters'
import { expect } from 'chai'

describe('store/modules/topics', () => {
    describe('smartFilter', () => {
        const topics = [
            {display_name: 'Strange Things', tracker: 'lostfilm.tv'},
            {display_name: 'Expanse', tracker: 'lostfilm.tv'},
            {display_name: 'Ray Donovan', tracker: 'rutor.org'},
            {display_name: 'Religion', tracker: 'rutor.org'}
        ]

        it('filter by lostfilm should left lostfilm tracker only', () => {
            expect(smartFilter(topics, 'lostfilm')).to.eql([topics[0], topics[1]])
        })

        it('filter by "r" should exclude Expanse', () => {
            expect(smartFilter(topics, 'r')).to.eql([topics[0], topics[2], topics[3]])
        })

        it('filter by "RE" should left Religion', () => {
            expect(smartFilter(topics, 'RE')).to.eql([topics[3]])
        })
    })

    describe('smartOrder', () => {
        const topics = [
            {display_name: 'Zeta', tracker: 'lostfilm.tv', last_update: '2017-02-13T23:00:00+00:00'},
            {display_name: 'Yota', tracker: 'lostfilm.tv', last_update: null},
            {display_name: 'Beta', tracker: 'rutor.org', last_update: '2017-02-14T01:00:00+00:00'},
            {display_name: 'Alpha', tracker: 'rutor.org', last_update: '2017-02-13T23:30:00+00:00'}
        ]

        it('sort by "display_name" should work', () => {
            expect(smartOrder(topics, 'display_name')).to.eql([...topics].reverse())
        })

        it('sort by "-display_name" should work', () => {
            expect(smartOrder(topics, '-display_name')).to.eql([...topics])
        })

        it('sort by "-last_update" should work, and without last_execute should be first', () => {
            expect(smartOrder(topics, '-last_update')).to.eql([topics[1], topics[2], topics[3], topics[0]])
        })

        it('sort by "last_update" should work, and without last_execute should be last', () => {
            expect(smartOrder(topics, 'last_update')).to.eql([topics[1], topics[2], topics[3], topics[0]].reverse())
        })

        it('sort by "last_update" should work, and take into topic display_name', () => {
            const testTopics = [
                ...topics,
                {display_name: '12345', tracker: 'rutor.org', last_update: '2017-02-13T23:30:00+00:00'}
            ]

            expect(smartOrder(testTopics, 'last_update')).to.eql([0, 4, 3, 2, 1].map(i => testTopics[i]))
        })
    })

    describe('mutations', () => {
        const stateBase = { loading: true, topics: null, last_execute: null, filterString: null, order: null }

        it('SET_TOPICS', () => {
            let state = { ...stateBase }
            const topics = [{display_name: 'A', last_update: null}, {display_name: 'B', last_update: null}]
            store.mutations[types.SET_TOPICS](state, { topics })

            expect(state.topics).to.equal(topics)
        })

        it('SET_LAST_EXECUTE', () => {
            let state = { ...stateBase }
            const execute = {finish_time: '2017-02-14T00:25:17+00:00'}
            store.mutations[types.SET_LAST_EXECUTE](state, { execute })

            expect(state.last_execute).to.equal(execute)
        })

        it('LOAD_FAILED', () => {
            let state = { ...stateBase }
            const err = new Error('Can not reach remote server')
            store.mutations[types.LOAD_FAILED](state, { err })
        })

        it('SET_FILTER_STRING', () => {
            let state = { ...stateBase }
            const value = 'lostfilm'
            store.mutations[types.SET_FILTER_STRING](state, { value })

            expect(state.filterString).to.equal(value)
        })

        it('SET_ORDER', () => {
            let state = { ...stateBase }
            const order = 'last_update'
            store.mutations[types.SET_ORDER](state, { order })

            expect(state.order).to.equal(order)
        })

        it('COMPLETE_LOADING', () => {
            let state = { ...stateBase }

            expect(state.loading).to.be.true

            store.mutations[types.COMPLETE_LOADING](state)

            expect(state.loading).to.be.false
        })

        it('SET_TOPIC_PAUSED', () => {
            let state = {
                ...stateBase,
                topics: [
                    {id: 10, display_name: 'Topic 1', paused: false},
                    {id: 11, display_name: 'Topic 2', paused: false}
                ]
            }

            expect(state.topics[1].paused).to.be.false

            store.mutations[types.SET_TOPIC_PAUSED](state, { topic: state.topics[1], value: true })

            expect(state.topics[1].paused).to.be.true
        })

        it('SET_TOPIC_PAUSED', () => {
            let state = {
                ...stateBase,
                topics: [
                    {id: 10, display_name: 'Topic 1', paused: false},
                    {id: 11, display_name: 'Topic 2', paused: true}
                ]
            }

            expect(state.topics[1].paused).to.be.true

            store.mutations[types.SET_TOPIC_PAUSED](state, { topic: state.topics[1], value: false })

            expect(state.topics[1].paused).to.be.false
        })

        it('SET_TOPIC_STATUS', () => {
            let state = {
                ...stateBase,
                topics: [
                    {id: 10, display_name: 'Topic 1', status: 'Error'},
                    {id: 11, display_name: 'Topic 2', status: 'NotFound'}
                ]
            }

            expect(state.topics[0].status).to.be.equal('Error')
            expect(state.topics[1].status).to.be.equal('NotFound')

            store.mutations[types.SET_TOPIC_STATUS](state, { topic: state.topics[0], value: 'Ok' })
            store.mutations[types.SET_TOPIC_STATUS](state, { topic: state.topics[1], value: 'Ok' })

            expect(state.topics[0].status).to.be.equal('Ok')
            expect(state.topics[1].status).to.be.equal('Ok')
        })

        it('SET_TOPIC_STATUS', () => {
            let state = {
                ...stateBase,
                topics: [
                    {id: 10, display_name: 'Topic 1', status: 'Error'},
                    {id: 11, display_name: 'Topic 2', status: 'NotFound'}
                ]
            }

            expect(state.topics[0].status).to.be.equal('Error')
            expect(state.topics[1].status).to.be.equal('NotFound')

            store.mutations[types.SET_TOPIC_STATUS](state, { topic: state.topics[0], value: 'NotFound' })
            store.mutations[types.SET_TOPIC_STATUS](state, { topic: state.topics[1], value: 'Error' })

            expect(state.topics[0].status).to.be.equal('NotFound')
            expect(state.topics[1].status).to.be.equal('Error')
        })
    })

    describe('actions', () => {
        const topics = [
            {display_name: 'Zeta', tracker: 'lostfilm.tv', last_update: '2017-02-13T23:00:00+00:00'},
            {display_name: 'Yota', tracker: 'lostfilm.tv', last_update: null}
        ]

        const logs = {
            count: 1,
            data: [
                {finish_time: '2017-02-14T01:35:47+00:00'}
            ]
        }

        it('loadTopics should works', async () => {
            try {
                sinon.stub(api.default, 'getTopics', () => Promise.resolve(topics))
                sinon.stub(api.default, 'getLogs', () => Promise.resolve(logs))

                const commit = sinon.spy()

                await store.actions.loadTopics({ commit })

                expect(commit).to.have.been.calledThrice

                expect(commit).to.have.been.calledWith(types.SET_TOPICS, { topics })
                expect(commit).to.have.been.calledWith(types.COMPLETE_LOADING)
                expect(commit).to.have.been.calledWith(types.SET_LAST_EXECUTE, { execute: logs.data[0] })
            } finally {
                api.default.getTopics.restore()
                api.default.getLogs.restore()
            }
        })

        it('loadTopics should works without logs', async () => {
            try {
                let logs = { count: 0, data: [] }

                sinon.stub(api.default, 'getTopics', () => Promise.resolve(topics))
                sinon.stub(api.default, 'getLogs', () => Promise.resolve(logs))

                const commit = sinon.spy()

                await store.actions.loadTopics({ commit })

                expect(commit).to.have.been.calledThrice

                expect(commit).to.have.been.calledWith(types.SET_TOPICS, { topics })
                expect(commit).to.have.been.calledWith(types.SET_LAST_EXECUTE, { execute: null })
                expect(commit).to.have.been.calledWith(types.COMPLETE_LOADING)
            } finally {
                api.default.getTopics.restore()
                api.default.getLogs.restore()
            }
        })

        it('loadTopics should fail if getTopics failed', async () => {
            try {
                const err = new Error('Test exception')

                sinon.stub(api.default, 'getTopics', function () {
                    return new Promise((resolve, reject) => setTimeout(() => reject(err), 10))
                })

                sinon.stub(api.default, 'getLogs', function () {
                    return new Promise((resolve, reject) => setTimeout(() => reject(err), 20))
                })

                const commit = sinon.spy()

                await store.actions.loadTopics({ commit })

                expect(commit).to.have.been.calledOnce

                expect(commit).to.have.been.calledWith(types.LOAD_FAILED, { err })
            } finally {
                api.default.getTopics.restore()
                api.default.getLogs.restore()
            }
        })

        it('loadTopics should fail if getLogs failed', async () => {
            try {
                const err = new Error('Test exception')

                sinon.stub(api.default, 'getTopics', function () {
                    return new Promise((resolve, reject) => setTimeout(() => reject(err), 20))
                })

                sinon.stub(api.default, 'getLogs', function () {
                    return new Promise((resolve, reject) => setTimeout(() => reject(err), 10))
                })

                const commit = sinon.spy()

                await store.actions.loadTopics({ commit })

                expect(commit).to.have.been.calledOnce
                expect(commit).to.have.been.calledWith(types.LOAD_FAILED, { err })
            } finally {
                api.default.getTopics.restore()
            }
        })

        it('setTopicPaused should works', async () => {
            try {
                sinon.stub(api.default, 'setTopicPaused', () => new Promise((resolve, reject) => setTimeout(() => resolve(), 0)))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1', paused: false},
                        {id: 11, display_name: 'Topic 2', paused: false}
                    ]
                }

                await store.actions.setTopicPaused({commit, state}, {id: 10, value: true})

                expect(commit).to.have.been.calledOnce
                expect(commit).to.have.been.calledWith(types.SET_TOPIC_PAUSED, {topic: state.topics[0], value: true})
            } finally {
                api.default.setTopicPaused.restore()
            }
        })

        it('setTopicPaused should restore value after fail', async () => {
            try {
                const err = new Error('Test exception')

                sinon.stub(api.default, 'setTopicPaused', () => new Promise((resolve, reject) => setTimeout(() => reject(err), 0)))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1', paused: false},
                        {id: 11, display_name: 'Topic 2', paused: false}
                    ]
                }

                await store.actions.setTopicPaused({commit, state}, {id: 11, value: true})

                expect(commit).to.have.been.calledTwice
                expect(commit).to.have.been.calledWith(types.SET_TOPIC_PAUSED, {topic: state.topics[1], value: true})
                expect(commit).to.have.been.calledWith(types.SET_TOPIC_PAUSED, {topic: state.topics[1], value: false})
            } finally {
                api.default.setTopicPaused.restore()
            }
        })

        it('setTopicPaused should not restore value after fail before api call', async () => {
            try {
                const err = new Error('Test exception')

                sinon.stub(api.default, 'setTopicPaused', () => new Promise((resolve, reject) => setTimeout(() => reject(err), 0)))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1', paused: false},
                        {id: 11, display_name: 'Topic 2', paused: false}
                    ]
                }

                await store.actions.setTopicPaused({commit, state}, {id: 12, value: true})

                expect(commit).to.have.not.been.called
            } finally {
                api.default.setTopicPaused.restore()
            }
        })

        it('resetTopicStatus should works', async () => {
            try {
                sinon.stub(api.default, 'resetTopicStatus', () => new Promise((resolve, reject) => setTimeout(() => resolve(), 0)))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1', status: 'Error'},
                        {id: 11, display_name: 'Topic 2', status: 'Ok'}
                    ]
                }

                await store.actions.resetTopicStatus({commit, state}, 10)

                expect(commit).to.have.been.calledOnce
                expect(commit).to.have.been.calledWith(types.SET_TOPIC_STATUS, {topic: state.topics[0], value: 'Ok'})
            } finally {
                api.default.resetTopicStatus.restore()
            }
        })

        it('resetTopicStatus should restore value after fail', async () => {
            try {
                const err = new Error('Test exception')

                sinon.stub(api.default, 'resetTopicStatus', () => new Promise((resolve, reject) => setTimeout(() => reject(err), 0)))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1', status: 'Error'},
                        {id: 11, display_name: 'Topic 2', status: 'NotFound'}
                    ]
                }

                await store.actions.resetTopicStatus({commit, state}, 10)

                expect(commit).to.have.been.calledTwice
                expect(commit).to.have.been.calledWith(types.SET_TOPIC_STATUS, {topic: state.topics[0], value: 'Ok'})
                expect(commit).to.have.been.calledWith(types.SET_TOPIC_STATUS, {topic: state.topics[0], value: 'Error'})

                commit.reset()

                await store.actions.resetTopicStatus({commit, state}, 11)

                expect(commit).to.have.been.calledTwice
                expect(commit).to.have.been.calledWith(types.SET_TOPIC_STATUS, {topic: state.topics[1], value: 'Ok'})
                expect(commit).to.have.been.calledWith(types.SET_TOPIC_STATUS, {topic: state.topics[1], value: 'NotFound'})
            } finally {
                api.default.resetTopicStatus.restore()
            }
        })

        it('resetTopicStatus should not restore value after fail before api call', async () => {
            try {
                const err = new Error('Test exception')

                sinon.stub(api.default, 'resetTopicStatus', () => new Promise((resolve, reject) => setTimeout(() => reject(err), 0)))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1', paused: false},
                        {id: 11, display_name: 'Topic 2', paused: false}
                    ]
                }

                await store.actions.resetTopicStatus({commit, state}, 12)

                expect(commit).to.have.not.been.called
            } finally {
                api.default.resetTopicStatus.restore()
            }
        })

        it('deleteTopic should works', async () => {
            try {
                sinon.stub(api.default, 'deleteTopic', () => new Promise((resolve, reject) => setTimeout(() => resolve(), 0)))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1'},
                        {id: 11, display_name: 'Topic 2'}
                    ]
                }

                await store.actions.deleteTopic({commit, state}, 10)

                expect(commit).to.have.been.calledOnce
                expect(commit).to.have.been.calledWith(types.SET_TOPICS, {topics: [state.topics[1]]})
            } finally {
                api.default.deleteTopic.restore()
            }
        })

        it('deleteTopic should restore value after fail', async () => {
            try {
                const err = new Error('Test exception')

                sinon.stub(api.default, 'deleteTopic', () => new Promise((resolve, reject) => setTimeout(() => reject(err), 0)))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1', status: 'Error'},
                        {id: 11, display_name: 'Topic 2', status: 'NotFound'}
                    ]
                }

                await store.actions.deleteTopic({commit, state}, 10)

                expect(commit).to.have.been.calledTwice
                expect(commit).to.have.been.calledWith(types.SET_TOPICS, {topics: [state.topics[1]]})
                expect(commit).to.have.been.calledWith(types.SET_TOPICS, {topics: state.topics})
            } finally {
                api.default.deleteTopic.restore()
            }
        })

        it('deleteTopic should not restore value after fail before api call', async () => {
            try {
                const err = new Error('Test exception')

                sinon.stub(api.default, 'deleteTopic', () => new Promise((resolve, reject) => setTimeout(() => reject(err), 0)))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1', paused: false},
                        {id: 11, display_name: 'Topic 2', paused: false}
                    ]
                }

                await store.actions.deleteTopic({commit, state}, 12)

                expect(commit).to.have.not.been.called
            } finally {
                api.default.deleteTopic.restore()
            }
        })

        it(`addTopic should works`, async () => {
            const url = 'http://www.lostfilm.tv/series/Taboo/'
            const topicResult = {
                form: [
                    {
                        type: 'row',
                        content: [
                            {
                                flex: 100,
                                type: 'text',
                                model: 'display_name',
                                label: 'Name'
                            }
                        ]
                    }
                ],
                settings: {
                    url,
                    download_dir: null,
                    status: 'Ok',
                    id: 12,
                    last_update: '2016-12-27T20:30:11.744680+00:00',
                    display_name: 'Табу / Taboo',
                    info: null
                }
            }

            try {
                sinon.stub(api.default, 'addTopic', () => new Promise((resolve, reject) => setTimeout(resolve(12))))
                sinon.stub(api.default, 'getTopic', () => new Promise((resolve, reject) => setTimeout(resolve(topicResult))))

                const commit = sinon.spy()

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1'},
                        {id: 11, display_name: 'Topic 2'}
                    ]
                }

                const settings = {display_name: 'Табу / Taboo', quality: '720p'}
                await store.actions.addTopic({commit, state}, {url, settings})

                expect(commit).to.have.been.calledOnce
                expect(commit).to.have.been.calledWith(types.SET_TOPICS, {topics: [...state.topics, topicResult.settings]})
            } finally {
                api.default.addTopic.restore()
                api.default.getTopic.restore()
            }
        })

        it(`failed addTopic because of addTopic should output error`, async () => {
            const url = 'http://www.lostfilm.tv/series/Taboo/'

            try {
                const error = new Error(`Cant't add topic`)
                sinon.stub(api.default, 'addTopic', () => new Promise((resolve, reject) => setTimeout(reject(error))))
                sinon.stub(api.default, 'getTopic', () => new Promise((resolve, reject) => setTimeout(reject(error))))

                const commit = sinon.spy()

                const consoleError = sinon.stub(console, 'error')

                let state = {
                    topics: [
                        {id: 10, display_name: 'Topic 1'},
                        {id: 11, display_name: 'Topic 2'}
                    ]
                }

                const settings = {display_name: 'Табу / Taboo', quality: '720p'}
                await store.actions.addTopic({commit, state}, {url, settings})

                expect(commit).to.have.not.been.called
                expect(consoleError).to.have.been.calledOnce
                expect(consoleError).to.have.been.calledWith(error)
            } finally {
                api.default.addTopic.restore()
                api.default.getTopic.restore()
            }
        })
    })

    describe('getters', () => {
        it('filteredTopics', () => {
            const state = {
                topics: [
                    {display_name: 'Zeta', tracker: 'lostfilm.tv', last_update: '2017-02-13T23:00:00+00:00'},
                    {display_name: 'Yota', tracker: 'lostfilm.tv', last_update: null},
                    {display_name: 'Beta', tracker: 'rutor.org', last_update: '2017-02-14T01:00:00+00:00'},
                    {display_name: 'Alpha', tracker: 'rutor.org', last_update: '2017-02-13T23:30:00+00:00'}
                ],
                filterString: '',
                order: '-last_update'
            }

            expect(store.getters.filteredTopics(state)).to.eql([1, 2, 3, 0].map(i => state.topics[i]))
        })

        it('trackers', () => {
            const state = {
                topics: [
                    {display_name: 'Zeta', tracker: 'lostfilm.tv', last_update: '2017-02-13T23:00:00+00:00'},
                    {display_name: 'Yota', tracker: 'lostfilm.tv', last_update: null},
                    {display_name: 'Beta', tracker: 'rutor.org', last_update: '2017-02-14T01:00:00+00:00'},
                    {display_name: 'Alpha', tracker: 'rutor.org', last_update: '2017-02-13T23:30:00+00:00'}
                ],
                filterString: '',
                order: '-last_update'
            }

            expect(store.getters.trackers(state)).to.eql(['lostfilm.tv', 'rutor.org'])
        })
    })
})
