import React, {Button} from 'react';
import {Link} from 'react-router';
import Avatar from './Avatar';

import MessageForm from './MessageForm';
import ActivityList from './ActivityList';
import SupportChannelMiniForm from '../components/SupportChannelMiniForm';

import {getChannelKey} from '../utils/reducers';
import {isAuthenticated} from '../utils/auth';
import {CHANNEL_TYPES} from '../constants/Api';

export default class ChatBox extends React.Component {
  constructor(){
    super()
    this.state = {
      showEmailForm: false
    }
  }
  getView() {
    if (this.props.channelView) {
      return this.props.channelView;
    }
    return null;
  }

  getEmailForm() {
    const { Channel } = this.props
    const emailForm = {
      action: 'send',
      activity_type: 'message',
      activity: {
        sender: {
          id: 'tunga',
          username: null,
          short_name: 'Tunga',
          display_name: 'Tunga',
          avatar_url: 'https://tunga.io/icons/Tunga_squarex150.png',
          hide: true,
        },
        isForm: true,
        body: (
          <div>
            {Channel.detail.channel.object_id
              ? <div className="text-center got-it">
                  <div>We got it! Thanks</div>
                  <i className="icon tunga-icon-check" />
                </div>
              : <div>
                  <div>Where can we reach you to follow up?</div>
                  <SupportChannelMiniForm {...this.props} />
                </div>}
          </div>
        ),
      },
    };

    return emailForm;
  }

  getInitMessage() {
    const { channel } = this.props
    return {
      action: 'send',
      activity_type: 'message',
      activity: {
        sender: {
          id: 'tunga',
          username: null,
          short_name: 'Elijah',
          display_name: 'Elijah',
          avatar_url: require('../images/chat/elijah.jpg'),
        },
        body: 'Hi, feel free to ask me anything.',
      }
    };
  }

  getOfflineActionsActivity() {
    return {
      action: 'send',
      activity_type: 'message',
      activity: {
        sender: {
          id: 'tunga',
          username: null,
          short_name: 'Tunga',
          display_name: 'Tunga',
          avatar_url: require('../images/logo_round.png'),
        },
        isForm: true,
        body: (
          <div>
            <p>Uh-oh, we are currently not online.</p>
            <p>We will reach out to you ASAP!</p>
            <div className="btn-group bubble-action" role="group">
              <button type="button" className="btn btn-default pull-left">
                <Link to='/call'>Schedule call </Link>
              </button>
              <button type="button" onClick={() => this.setState({showEmailForm: true})} className="btn btn-default pull-right">Contact me via email</button>
            </div>
          </div>
        )
        // body: 'Uh-oh, we are currently not online.\nWe will reach out to you ASAP!',
      }
    }
  }

  onSendMessage(body, attachments) {
    const {channel, Channel, MessageActions, ChannelActions} = this.props;
    MessageActions.createMessage({channel: channel.id, body}, attachments);
    if(channel.type == CHANNEL_TYPES.support && !Channel.chatStarted) {
      ChannelActions.recordChatStart();
    }
  }

  onUpload(files) {
    const {channel, ChannelActions} = this.props;
    ChannelActions.updateChannel(channel.id, null, files);
  }

  render() {
    const {channel, Auth, Channel, ChannelActions, Message} = this.props;
    const {attachments} = channel;
    let view = this.getView();
    var activities =
      Channel.detail.activity.items[getChannelKey(channel.id)] || [];
    if (channel.type == CHANNEL_TYPES.support) {
      activities = [
        this.getInitMessage(),
        ...activities,
      ];
      if (activities.length >= 2 && !isAuthenticated()) {
        activities = [
          ...activities.slice(0, 2),
          this.getOfflineActionsActivity(),
          ...activities.slice(2),
        ];
      }
      if (activities.length >= 3 && !isAuthenticated() && this.state.showEmailForm) {
        activities = [
          ...activities.slice(0, 3),
          this.getEmailForm(),
          ...activities.slice(3),
        ];
      }
    }

    return (
      <div className="list-box">
        {view == 'files'
          ? <div className="attachment-list">
              {attachments
                ? <div>
                    <h4>Files</h4>
                    {attachments.map(upload => {
                      return (
                        <div key={upload.id} className="file">
                          <a href={upload.url}>
                            <i className="fa fa-download" /> {upload.name}{' '}
                            <strong>[{upload.display_size}]</strong>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                : null}
            </div>
          : null}

        {view == 'people'
          ? <div className="people-list">
              <h4>People</h4>
              {channel.details && channel.details.participants
                ? <div className="row">
                    {channel.details.participants.map(user => {
                      return (
                        <div key={user.id} className="col-md-6">
                          <div className="media card">
                            <div className="media-left">
                              <Avatar src={user.avatar_url} size="" />
                            </div>
                            <div className="media-body">
                              <div>
                                <Link to={`/people/${user.username}`}>
                                  {user.display_name}
                                </Link>
                              </div>
                              <div className="secondary">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                : null}
            </div>
          : null}

        {['files', 'people'].indexOf(view) == -1
          ? [
              <ActivityList
                key="list"
                Auth={Auth}
                activities={activities}
                isLoading={
                  Channel.detail.activity.isFetching[
                    getChannelKey(channel.id)
                  ] || false
                }
                isLoadingMore={
                  Channel.detail.activity.isFetchingMore[
                    getChannelKey(channel.id)
                  ] || false
                }
                loadMoreUrl={
                  Channel.detail.activity.next[getChannelKey(channel.id)] ||
                  null
                }
                loadMoreCallback={ChannelActions.listMoreChannelActivity}
                loadMoreText="Show older messages"
                last_read={channel.previous_last_read || channel.last_read}
              />,
              <MessageForm
                key="msg_form"
                messageCallback={this.onSendMessage.bind(this)}
                messageSaved={Message.detail.isSaved}
                uploadCallback={this.onUpload.bind(this)}
                uploadSaved={Channel.detail.isSaved}
                isSending={Message.detail.isSaving || Channel.detail.isSaving}
                canUpload={isAuthenticated()}
              />,
            ]
          : null}
      </div>
    );
  }
}
