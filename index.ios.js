// WebView component that takes HTML strings and sanitises them to
// remove javascript and any other dangerous tags. Link clicks will
// generate events but won't automatically change what is displayed.

import React, { Component, PropTypes } from 'react';
import {
  View,
  ActivityIndicatorIOS,
  requireNativeComponent
} from 'react-native';

var safeHtml = require('safe-html');
var _ = require('underscore');


var _HTMLWebView = React.createClass({
  propTypes: {
    html: PropTypes.string,
    autoHeight: PropTypes.bool
  },
  render: function () {
    return <NativeHTMLWebView {...this.props}/>;
  }
});
var NativeHTMLWebView = requireNativeComponent('AIBHTMLWebView', _HTMLWebView);

var HTMLWebView = React.createClass({
  propTypes: {
    html: PropTypes.string.isRequired,
    makeSafe: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    onLink: PropTypes.func,
    style: View.propTypes.style,
    // Should this view adjust its height automatically to show its
    // complete content
    autoHeight: PropTypes.bool
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state);
  },

  getInitialState: function() {
    return {
      contentHeight: 1,
      loaded: false
    };
  },

  render: function () {
    // Don't do the expensive safeHtml operation more often than
    // needed. This is assume you don't mutate and reuse the same
    // makeSafe config object, please don't do that.
    if (this._currentHtml !== this.props.html || !_.isEqual(this._currentMakeSafe, this.props.makeSafe)) {
      this._currentHtml = this.props.html;
      this._currentMakeSafe = this.props.makeSafe;
      this._safeHtml = this.safeHtml(this._currentHtml);
    }
    return (
      <View >
        {!this.state.loaded &&
          <ActivityIndicatorIOS
            animating={true}
            style={{padding:10}}
            size='small' />}
        <_HTMLWebView
          style={[{height: this.state.contentHeight}, this.props.style]}
          html={this._safeHtml}
          autoHeight={this.props.autoHeight}
          onLink={this.onLink}
          onDoneLoading={() => this.setState({loaded: true})}
          onChangeHeight={(e) => {
            this.contentHeight = e.nativeEvent.contentHeight;
            if (this.props.autoHeight && this.contentHeight > 1) {
              this.onChangeHeight();
            }
          }} />
      </View>
    );
  },

  safeHtml: function (html) {
    var config = this.props.makeSafe;
    if (config === false) {
      // saveHtml disabled
      return html;
    } else if (!_.isObject(config)) {
      config = module.exports.HTML_SAFE_CONFIG;
    }
    return safeHtml(html, config);
  },

  onLink: function (e) {
    if (_.isFunction(this.props.onLink)) {
      this.props.onLink(e.nativeEvent);
    }
  },

  onChangeHeight: function () {
    if (this.contentHeight !== this.state.contentHeight) {
      this.setState({contentHeight: this.contentHeight});
    } else if (this.contentHeight === this.state.contentHeight) {
      // this.setState({loaded: true});
    }
  }
});



module.exports = HTMLWebView;

// Allow a few more things than the default config for safe-html since
// we know where it's going to be used.
module.exports.HTML_SAFE_CONFIG = _.defaults(
  {
    allowedTags: safeHtml.DEFAULT_CONFIG.allowedTags.concat(["img", "style"]),
    allowedAttributes: _.defaults(
      {
        id: {allTags: true},
        style: {allTags: true},
        src: {allowedTags: ["img"]}
      }, safeHtml.DEFAULT_CONFIG.allowedAttributes)
  },
  safeHtml.DEFAULT_CONFIG
);
