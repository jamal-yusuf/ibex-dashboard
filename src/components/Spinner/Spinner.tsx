import * as request from 'xhr-request';
import * as React from 'react';
import * as _ from 'lodash';

import CSSTransitionGroup from 'react-addons-css-transition-group';
import CircularProgress from 'react-md/lib/Progress/CircularProgress';
import Snackbar from 'react-md/lib/Snackbars';

import SpinnerStore, { ISpinnerStoreState } from './SpinnerStore';
import SpinnerActions from './SpinnerActions';

interface ISpinnerState extends ISpinnerStoreState {
  snacks?: {
    toasts?: any[],
    autohide?: boolean
  }
}

export default class Spinner extends React.Component<any, ISpinnerState> {

  constructor(props) {
    super(props);

    this.state = SpinnerStore.getState();
    (this.state as any).snacks = {
      toasts: [],
      autohide: true
    };

    this.onChange = this.onChange.bind(this);
    this._addToast = this._addToast.bind(this);
    this._removeToast = this._removeToast.bind(this);
    this._429ApplicationInsights = this._429ApplicationInsights.bind(this);

    var self = this;
    var open_original = XMLHttpRequest.prototype.open;
    var send_original = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, async, unk1, unk2) {
      SpinnerActions.startRequestLoading();
      open_original.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(data) {
      let _xhr = this;
      _xhr.onreadystatechange = (response) => {

        // readyState === 4: means the response is complete
        if(_xhr.readyState === 4) {
          SpinnerActions.endRequestLoading();
        }
      }
      send_original.apply(_xhr, arguments);
    };

    // Todo: Add timeout to requests - if no reply received, turn spinner off
  }

  componentDidMount() {
    SpinnerStore.listen(this.onChange);
  }

  componentWillUpdate(nextProps, nextState: ISpinnerState) {
    const { snacks } = nextState;
    const [toast] = snacks.toasts;
    if (this.state.snacks.toasts === snacks.toasts || !toast) {
      return;
    }

    snacks.autohide = toast.action !== 'Retry';
    this.setState({ snacks });
  }

  _removeToast() {
    const { snacks } = this.state;
    const [, ...toasts] = snacks.toasts;
    snacks.toasts = toasts;
    this.setState({ snacks });
  }

  _429ApplicationInsights() {
    this._addToast('You have reached the maximum number of Application Insights requests.');
  }

  _addToast(text, action = null) {
    const { snacks } = this.state;
    const toasts = snacks.toasts.slice();

    if (_.find(toasts, { text })) {
      return;
    }

    toasts.push({ text, action });
    snacks.toasts = toasts;

    this.setState({ snacks });
  }

  onChange(state) {
    this.setState(state);
  }

  render () {

    let refreshing = this.state.pageLoading || this.state.requestLoading || false;

    return (
      <div>
        { refreshing && <CircularProgress key="progress" id="contentLoadingProgress" /> }
        <Snackbar {...this.state.snacks} onDismiss={this._removeToast} />
      </div>
    )
  }
}