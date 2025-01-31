import React from 'react'
import DocsPageWithNav from './../../../pageClasses/docsPageWithSideNav.js'
import { Row, Col } from 'react-bootstrap'
import DocsPage from './../../../components/layouts/docsPage.js'

import Code from './../../../components/code.js'

const ServerTemplate =
`var initialize = function(api, options, next){

  //////////
  // INIT //
  //////////

  var type = "test"
  var attributes = {
    canChat: true,
    logConnections: true,
    logExits: true,
    sendWelcomeMessage: true,
    verbs: [],
  }

  var server = new api.GenericServer(type, options, attributes);

  //////////////////////
  // REQUIRED METHODS //
  //////////////////////

  server.start = function(next){}

  server.stop = function(next){}

  server.sendMessage = function(connection, message, messageCount){}

  server.sendFile = function(connection, error, fileStream, mime, length){};

  server.goodbye = function(connection, reason){};

  ////////////
  // EVENTS //
  ////////////

  server.on("connection", function(connection){});

  server.on('actionComplete', function(data){
    completeResponse(data);
  });

  /////////////
  // HELPERS //
  /////////////

  next(server);
}

/////////////////////////////////////////////////////////////////////
// exports
exports.initialize = initialize;
`

const DesigningServers =
`server.buildConnection({
  rawConnection: {
    req: req,
    res: res,
    method: method,
    cookies: cookies,
    responseHeaders: responseHeaders,
    responseHttpCode: responseHttpCode,
    parsedURL: parsedURL
  },
  id: randomNumber(),
  remoteAddress: remoteIP,
  remotePort: req.connection.remotePort}
); // will emit "connection"

// Note that connections will have a \`rawConnection\` property.  This is where you should store the actual object(s) returned by your server so that you can use them to communicate back with the client.  Again, an example from the \`web\` server:

server.sendMessage = function(connection, message){
   cleanHeaders(connection);
   var headers = connection.rawConnection.responseHeaders;
   var responseHttpCode = parseInt(connection.rawConnection.responseHttpCode);
   var stringResponse = String(message)
   connection.rawConnection.res.writeHead(responseHttpCode, headers);
   connection.rawConnection.res.end(stringResponse);
   server.destroyConnection(connection);
 }`

const Verbs =
 `allowedVerbs: [
      "quit",
      "exit",
      "paramAdd",
      "paramDelete",
      "paramView",
      "paramsView",
      "paramsDelete",
      "roomChange",
      "roomView",
      "listenToRoom",
      "silenceRoom",
      "detailsView",
      "say"
    ]`

const ParseRequset =
`var parseRequest = function(connection, line){
   var words = line.split(" ");
   var verb = words.shift();
   if(verb == "file"){
     if (words.length > 0){
       connection.params.file = words[0];
     }
     server.processFile(connection);
   }else{
     connection.verbs(verb, words, function(error, data){
       if(error == null){
         var message = {status: "OK", context: "response", data: data}
         server.sendMessage(connection, message);
       }else if(error === "verb not found or not allowed"){
         connection.error = null;
         connection.response = {};
         server.processAction(connection);
       }else{
         var message = {status: error, context: "response", data: data}
         server.sendMessage(connection, message);
       }
     });
   }
 }`

export default class extends DocsPageWithNav {
  constructor (props) {
    super(props)

    this.state = {
      titleSection: {
        title: 'Core: Servers',
        icon: '/static/images/internet-of-things.svg'
      },
      sections: {
        'overview': 'Overview',
        'designing-servers': 'Designing Servers',
        'options-and-attributes': 'Options and Attributes',
        'verbs': 'Verbs',
        'chat': 'Chat',
        'sending-responses': 'Senging Responses',
        'sending-files': 'Sending Files'
      },
      links: [
        {link: '/docs/core/localization', title: '» Core: Localization'},
        {link: '/docs/core/plugins', title: '« Core: Plugins'}
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
                <Code>{ServerTemplate}</Code>
                <p>In ActionHero v6.0.0 and later, we have introduced a modular server system which allows you to create your own servers.  Servers should be thought of as any type of listener to clients, streams or your file system.  In ActionHero, the goal of each server is to ingest a specific type of connection and transform each client into a generic <code>connection</code> object which can be operated on by the rest of ActionHero.  To help with this, all servers extend <code>api.GenericServer</code> and fill in the required methods.</p>
                <p>To get started, you can use the <code>generateServer action</code> (name is required).  This will generate a template server which looks like the above.</p>
                <p>Like initializers, the <code>start()</code> and <code>stop()</code> methods will be called when the server is to boot up in ActionHero's lifecycle, but before any clients are permitted into the system.  Here is where you should actually initialize your server (IE: <code>https.createServer.listen</code>, etc).</p>
              </div>
            )}

            { this.section('designing-servers',
              <div>
                <Code>{DesigningServers}</Code>
                <p>Your job, as a server designer, is to coerce every client's connection into a connection object.  This is done with the <code>sever.buildConnection</code> helper.  Here is an example from the <code>web</code> server:</p>
              </div>
            )}

            { this.section('options-and-attributes',
              <div>
                <p>A server defines <code>attributes</code> which define it's behavior.  Variables like <code>canChat</code> are defined here. <code>options</code> are passed in, and come from <code>api.config.servers[serverName]</code>.  These can be new variables (like https?) or they can also overwrite the set <code>attributes</code>.</p>
                <p>The required attributes are provided in a generated server.</p>
              </div>
            )}

            { this.section('verbs',
              <div>
                <Code>{Verbs}</Code>
                <p>When an incoming message is detected, it is the server's job to build <code>connection.params</code>.  In the <code>web</code> server, this is accomplished by reading GET, POST, and form data.  For <code>websocket</code> clients, that information is expected to be emitted as part of the action's request.  For other clients, like <code>socket</code>, ActionHero provides helpers for long-lasting clients to operate on themselves.  These are called connection <code>verbs</code>.</p>
                <p>Clients use verbs to add params to themselves, update the chat room they are in, and more.   The list of verbs currently supported is listed above.</p>
                <p>Your server should be smart enough to tell when a client is trying to run an action, request a file, or use a verb.  One of the attributes of each server is <code>allowedVerbs</code>, which defines what verbs a client is allowed to preform.  A simplified example of how the <code>socket</code> server does this:</p>
                <Code>{ParseRequset}</Code>
              </div>
            )}

            { this.section('chat',
              <div>
                <p>The <code>attribute</code> "canChat" defines if clients of this server can chat.  If clients can chat, they should be allowed to use vebs like "roomChange" and "say".  They will also be sent messages in their room (and rooms they are listening too) automatically.</p>
              </div>
            )}

            { this.section('sending-responses',
              <div>
                <p>All servers need to implement the <code>server.sendMessage = function(connection, message, messageCount)</code> method so ActionHero knows how to talk to each client.  This is likely to make use of <code>connection.rawConnection</code>.  If you are writing a server for a persistent connection, it is likely you will need to respond with <code>messageCount</code> so that the client knows which request your response is about (as they are not always going to get the responses in order).</p>
              </div>
            )}

            { this.section('sending-files',
              <div>
                <p>Servers can optionally implement the <code>server.sendFile = function(connection, error, fileStream, mime, length)</code> method.  This method is responsible for any connection-specific file transport (headers, chinking, encoding, etc). Note that fileStream is a <code>stream</code> which should be <code>pipe</code>d to the client.</p>
              </div>
            )}
          </Col>
        </Row>
      </DocsPage>
    )
  }
}
