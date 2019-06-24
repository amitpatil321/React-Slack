import React, { Component } from 'react';
import { filter, isEqual } from 'lodash';
import { connect } from 'react-redux';

import {
  hideListChannels,
  showLoading,
  hideLoading,
  joinRoom,
  showListChannels
} from 'store/SlackActions';
import ListChannels from 'components/Sidebar/ListChannels';
import { getJoinableRooms, joinChannel } from 'utils/ChatKitUtil';

// TODO : Replace componentDidMount with componentDidUpdate, to show latest changes
// TODO : Joinable channels list still shows channel which is recently joined
// Remove "Join" button if its not required
class ListChannelsContainer extends Component {
  state = {
    text: null,
    error: null,
    joinableRooms: null
  };

  componentDidMount() {
    console.log('did mount');
    this._getJoinableRooms(rooms => {
      this.setState({ joinableRooms: rooms });
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { listChannelsModalVisible } = this.props;
    const { joinableRooms } = this.state;
    if (
      listChannelsModalVisible !== nextProps.listChannelsModalVisible ||
      !isEqual(joinableRooms, nextState.joinableRooms)
    )
      return true;
    return false;
  }

  componentDidUpdate() {
    console.log("Update", this.props.listChannelsModalVisible);
    const existingRooms = this.state.joinableRooms.map(room => room.name);
    this._getJoinableRooms(rooms => {
      const newRooms = rooms.map(room => room.name);
      console.log(existingRooms, newRooms);
      if (!isEqual(existingRooms, newRooms)) {
        console.log('state updated', newRooms);
        this.setState({ joinableRooms: rooms });
      }
    });
  }

  _onChange = event => {
    const searchString = event.target.value;
    // filter lists based on search text
    this.setState({ text: searchString });
  };

  _becomeRoomMember = roomToJoin => {
    const {
      user,
      hideListChannels,
      showLoading,
      joinRoom,
      showListChannels,
      hideLoading
    } = this.props;

    hideListChannels();
    showLoading('Joining room please wait...');
    joinChannel(
      user,
      roomToJoin,
      joinedRoom => {
        joinRoom(joinedRoom);
        hideLoading();
      },
      err => {
        showListChannels();
        this.setState({ error: 'Failed to join room, Please try again' });
        hideLoading();
      }
    );
  };

  _getJoinableRooms(callback) {
    const { user } = this.props;
    getJoinableRooms(
      user,
      rooms => callback(rooms),
      () => this.setState({ error: 'Error fetching joinable rooms' })
    );
  }

  render() {
    const { text, error, joinableRooms } = this.state;
    const { user, room, listChannelsModalVisible, hideListChannels, joinRoom } = this.props;

    return (
      <ListChannels
        user={user}
        room={room}
        text={text}
        onChange={this._onChange}
        existingRooms={filter(this.props.rooms, { customData: undefined })} // Ignore private chat rooms
        joinableRooms={joinableRooms}
        becomeRoomMember={this._becomeRoomMember} // Join new room
        gotoRoom={joinRoom} // Goto existing room already joined
        listChannelsModalVisible={listChannelsModalVisible}
        hideListChannels={hideListChannels}
        error={error}
      />
    );
  }
}

const mapStateToProps = ({ user, room, rooms, listChannelsModalVisible }) => ({
  user,
  room,
  rooms,
  listChannelsModalVisible
});

const mapDispatchToProps = dispatch => ({
  showListChannels: () => dispatch(showListChannels()),
  hideListChannels: () => dispatch(hideListChannels()),
  showLoading: msg => dispatch(showLoading(msg)),
  hideLoading: () => dispatch(hideLoading()),
  joinRoom: room => dispatch(joinRoom(room))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListChannelsContainer);
