import React from 'react'
import DocsPageWithNav from './../../../pageClasses/docsPageWithSideNav.js'
import { Row, Col } from 'react-bootstrap'
import DocsPage from './../../../components/layouts/docsPage.js'

export default class extends DocsPageWithNav {
  constructor (props) {
    super(props)

    this.state = {
      titleSection: {
        title: 'Core: Cache',
        icon: '/static/images/video-game-servers.svg'
      },
      sections: {
        'overview': 'Overview',
        'cache-methods': 'Cache Methods',
        'list-methods': 'List Methods',
        'lock-methods': 'Lock Methods',
        'redis': 'Redis & Cache'
      },
      links: [
        {link: '/docs/core/chat', title: '» Core: Chat'},
        {link: '/docs/core/action-cluster', title: '« Core: Action Cluster'}
      ]
    }
  }

  render () {
    return (
      <DocsPage sideNav={this.state.sections} titleSection={this.state.titleSection} links={this.state.links} currentSection={this.state.currentSection}>
        <Row>
          <Col md={12}>
            { this.section('overview',
              <div>
                <p>ActionHero ships with the functions needed for a distributed key-value cache.  You can cache strings, numbers, arrays and objects (anything that responds to <code>JSON.stringify</code>).</p>
                <p>The cache's redis server is defined by <code>api.config.redis</code>.  It is possible to use fakeredis.</p>
              </div>
            )}

            { this.section('cache-methods',
              <div>
                <h3><code>api.cache.save</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.save(key, value, expireTimeMS, next)</code>
                    <ul>
                      <li><code>expireTimeMS</code> can be null if you never want the object to expire</li>
                    </ul>
                  </li>
                  <li>Callback: <code>next(error, newObject)</code>
                    <ul>
                      <li><code>error</code> will be null unless the object can't be saved (perhaps out of ram or a bad object type).</li>
                      <li>overwriting an existing object will return <code>newObject = true</code></li>
                    </ul>
                  </li>
                </ul>

                <p><code>api.cache.save</code> is used to both create new entries or update existing cache entries.  If you don't define an expireTimeMS, <code>null</code> will be assumed, and using <code>null</code> will cause this cached item to never expire.  Expired cache objects will be periodically swept away (but not necessarily exactly when they expire)</p>

                <h3><code>api.cache.load</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.load(key, next)</code> or <code>api.cache.load(key, options, next)</code>
                    <ul>
                      <li><code>options</code> can be <code>{`{expireTimeMS: 1234}`}</code> where the act of reading the key will reset the key's expire time</li>
                      <li>If the requested <code>key</code> is not found (or is expired), all values returned will be null.</li>
                    </ul>
                  </li>
                  <li>Callback: <code>next(error, value, expireTimestamp, createdAt, readAt)</code>
                    <ul>
                      <li><code>value</code> will be the object which was saved and <code>null</code> if the object cannot be found or is expired</li>
                      <li><code>expireTimestamp</code> (ms) is when the object is set to expire in system time</li>
                      <li><code>createdAt</code> (ms) is when the object was created</li>
                      <li><code>readAt</code> (ms) is the timestamp at which the object was last read with <code>api.cache.load</code>.  Useful for telling if another worker has consumed the object recently</li>
                    </ul>
                  </li>
                </ul>

                <h3><code>api.cache.destroy</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.destroy(key)</code></li>
                  <li>Callback: <code>next(error, destroyed)</code>
                    <ul>
                      <li>will be false if the object cannot be found, and true if destroyed</li>
                    </ul>
                  </li>
                </ul>
              </div>
            )}

            { this.section('list-methods',
              <div>
                <p><code>api.cache</code> implements a distributed shared list.  3 simple functions are provided to interact with this list, <code>push</code>, <code>pop</code>, and <code>listLength</code>.  These lists are stored in Redis, and cannot be locked.  That said, a <code>push</code> and <code>pop</code> operation will guarantee that one-and-only-one copy of your data is returned to whichever application acted first (when popping) or an error will be returned (when pushing).</p>

                <h3><code>api.cache.push</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.push(key, data, next)</code>
                    <ul>
                      <li>data must be serializable via JSON.stringify</li>
                    </ul>
                  </li>
                  <li>Callback: <code>next(error)</code></li>
                </ul>

                <h3><code>api.cache.pop</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.pop(key, next)</code></li>
                  <li>Callback: <code>next(error, data)</code>
                    <ul>
                      <li>data will be returned in the object form it was saved (array, object, string)</li>
                    </ul>
                  </li>
                </ul>

                <h3><code>api.cache.listLength</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.listLength(key, next)</code></li>
                  <li>Callback: <code>next(error, length)</code>
                    <ul>
                      <li>length will be an integer.
                        <ul>
                          <li>if the list does not exist, <code>0</code> will be returned</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            )}

            { this.section('lock-methods',
              <div>
                <p>You may optionally implement locking methods along with your cache objects.  This will allow one ActionHero server to obtain a lock on an object and prevent modification of it by another member of the cluster.  For example you may want to first <code>api.cache.lock</code> a key, and then save it to prevent other nodes from modifying the object.</p>

                <h3><code>api.cache.lock</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.lock(key, expireTimeMS, next)</code>
                    <ul>
                      <li><code>expireTimeMS</code> is optional, and will be <code>expireTimeMS = api.cache.lockDuration = api.config.general.lockDuration</code></li>
                    </ul>
                  </li>
                  <li>Callback: <code>next(error, lockOk)</code>
                    <ul>
                      <li><code>error</code> will be null unless there was something wrong with the connection (perhaps a redis error)</li>
                      <li><code>lockOk</code> will be <code>true</code> or <code>false</code> depending on if the lock was obtained.</li>
                    </ul>
                  </li>
                </ul>

                <h3><code>api.cache.unlock</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.unlock(key, next)</code></li>
                  <li>Callback: <code>next(error, lockOk)</code>
                    <ul>
                      <li><code>error</code> will be null unless there was something wrong with the connection (perhaps a redis error)</li>
                      <li><code>lockOk</code> will be <code>true</code> or <code>false</code> depending on if the lock was removed.</li>
                    </ul>
                  </li>
                </ul>

                <h3><code>api.cache.checkLock</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.checkLock(key,retry, next)</code>
                    <ul>
                      <li><code>retry</code> is either <code>null</code> or an integer (ms) that we should keep retrying until the lock is free to be re-obtained</li>
                    </ul>
                  </li>
                  <li>Callback: <code>next(error, lockOk)</code>
                    <ul>
                      <li><code>error</code> will be null unless there was something wrong with the connection (perhaps a redis error)</li>
                      <li><code>lockOk</code> will be <code>true</code> or <code>false</code> depending on if the lock is currently obtainable.</li>
                    </ul>
                  </li>
                </ul>

                <h3><code>api.cache.locks</code></h3>

                <ul>
                  <li>Invoke: <code>api.cache.locks(next)</code></li>
                  <li>Callback: <code>next(error, locks)</code>
                    <ul>
                      <li><code>locks</code> is an array of all currently active locks</li>
                    </ul>
                  </li>
                </ul>

                <p>You can see an example of using the cache within an action in <a href='https://github.com/actionhero/actionhero/blob/master/actions/cacheTest.js'>actions/cacheTest.js</a></p>

              </div>
            )}

            { this.section('redis',
              <div>
                <p>The timestamps regarding <code>api.cache.load</code> are to help clients understand if they are working with data which has been modified by another peer (when running in a cluster).</p>
                <p>Keep in mind that many clients/servers can access a cached value simultaneously, so build your actions carefully not to have conflicting state.  You can <a href='/docs/core/cache'>learn more about the cache methods here</a>.  You can also <a href='/docs/deployment/production'>review recommendations about Production Redis configurations</a>.</p>
              </div>
            )}

          </Col>
        </Row>
      </DocsPage>
    )
  }
}
