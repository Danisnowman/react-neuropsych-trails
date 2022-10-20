import React from "react";
import PropTypes from "prop-types";
import Theme from "./theme";
import Marker from "./marker";
import PopUp from "./popup";
import TrailsA from "./trails_a";
import TrailsASample from "./trails_a_sample";
import TrailsB from "./trails_b";
import TrailsBSample from "./trails_b_sample";
import TrailsA12 from "./trails_a_12";
import TrailsB12 from "./trails_b_12";
import TrailTypes from "./trail_types";
import ContainerDimensions from "react-container-dimensions";

export default class Trails extends React.PureComponent {
  static propTypes = {
    beginEndLabels: PropTypes.bool,
    completedText: PropTypes.string,
    errorDuration: PropTypes.number,
    errorText: PropTypes.string,
    feedback: PropTypes.bool,
    onCompleted: PropTypes.func,
    onError: PropTypes.func,
    onMiss: PropTypes.func,
    onRetry: PropTypes.func,
    onSuccess: PropTypes.func,
    part: PropTypes.string.isRequired,
    progress: PropTypes.number,
    retry: PropTypes.bool,
  };

  static defaultProps = {
    beginEndLabels: false,
    part: "A",
    feedback: true,
    errorText: "X",
    errorDuration: 500,
    completedText: "Completed!",
    progress: 0,
    retry: false,
    retryText: "Would you like to retry?",
    onRetry: () => {},
    onSuccess: (date, token) => {},
    onError: (date, correctToken, selectedToken) => {},
    onCompleted: (date) => {},
    onMiss: (date, correctToken, x, y) => {},
  };

  constructor(props) {
    super(props);
    this.timeout = undefined;
  }

  state = {
    trails: null,
    error: "",
  };

  componentDidMount() {
    this.setState({ trail: TrailsA() });
  }

  handleSuccess = (e, index) => {
    let date = new Date();
    let trail = this.trail();

    // want event to bubble but still prevent on miss from being triggered
    this.handled = true;

    // clear any error and update the progress
    clearTimeout(this.timeout);
    this.setState({ error: "" });

    // notify parent
    this.props.onSuccess(date, trail.tokens[index]);

    // check if trails has been completed and notify if true
    if (this.props.progress >= trail.tokens.length - 1) {
      this.props.onCompleted(date);
    }
  };

  handleError = (e, index) => {
    let date = new Date();
    let trail = this.trail();

    // notify parent
    this.props.onError(
      date,
      trail.tokens[this.props.progress],
      trail.tokens[index]
    );

    // want event to bubble but still prevent on miss from being triggered
    this.handled = true;

    // if sending feedback, display an error showing the wrong marker was selected
    if (this.props.feedback) {
      this.setState({ error: this.props.errorText });

      // remove the error after a predetermined duration
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.setState({ error: "" });
      }, this.props.errorDuration);
    }
  };

  handleMiss = (e) => {
    let date = new Date();

    // notify parent if not handled already by success or error
    if (!this.handled) {
      this.props.onMiss(
        date,
        this.trail().tokens[this.props.progress],
        e.nativeEvent.offsetX,
        e.nativeEvent.offsetY
      );
    } else {
      this.handled = false;
    }
  };

  trail = () => {
    switch (this.props.part) {
      case TrailTypes.A:
        return TrailsA;
      case TrailTypes.ASample:
        return this.state.trail;
      case TrailTypes.B:
        return TrailsB;
      case TrailTypes.BSample:
        return TrailsBSample;
      case TrailTypes.A12:
        return this.state.trail;
      case TrailTypes.B12:
        return TrailsB12;
      default:
        return TrailsA;
    }
  };

  renderMarkers = (tokens, diameter, scale) => {
    let markers = [];

    for (let i = 0; i < tokens.length; i++) {
      // if correctly selected show as completed
      let theme = this.props.progress > i ? Theme.success : Theme.error;

      // if next in line to be selected handle with success
      // else handle with error
      let handler =
        this.props.progress === i
          ? (e) => this.handleSuccess(e, i)
          : (e) => this.handleError(e, i);

      // if finished, don't listen anymore
      if (this.props.progress >= tokens.length) {
        handler = undefined;
      }

      // add the marker keyed to the token
      markers.push(
        <Marker
          cx={Math.floor(tokens[i].x * scale)}
          cy={Math.floor(tokens[i].y * scale)}
          fontSize={Math.floor((diameter / 2) * scale)}
          key={"trails-marker-" + tokens[i].text}
          onClick={handler}
          r={Math.floor((diameter / 2) * scale)}
          text={tokens[i].text}
          theme={theme}
        />
      );
    }
    return markers;
  };

  renderBeginEndLabels = (trail, scale) => {
    if (this.props.beginEndLabels === false) {
      return null;
    }
    const firstToken = trail.tokens[0];
    const lastToken = trail.tokens[trail.tokens.length - 1];
    const labelStyle = {
      fontSize: Math.floor((((trail.diameter / 2) * 8) / 10) * scale),
      fontStyle: "italic",
    };
    return (
      <React.Fragment>
        <text
          className="trails-label"
          style={labelStyle}
          x={
            Math.floor(firstToken.x * scale) -
            Math.floor((trail.diameter / 2) * scale)
          }
          y={
            Math.floor(firstToken.y * scale) -
            Math.floor((trail.diameter / 1.5) * scale)
          }
        >
          Begin
        </text>
        <text
          className="trails-label"
          style={labelStyle}
          x={
            Math.floor(lastToken.x * scale) -
            Math.floor((trail.diameter / 2.75) * scale)
          }
          y={
            Math.floor(lastToken.y * scale) -
            Math.floor((trail.diameter / 1.5) * scale)
          }
        >
          End
        </text>
      </React.Fragment>
    );
  };

  renderSVG = (dim) => {
    let trail = this.trail();
    let scaleX = Math.floor((dim.width / trail.width) * 10) / 10;
    let scaleY = Math.floor((dim.height / trail.height) * 10) / 10;
    let scale = scaleX;
    if (scaleY < scaleX) {
      scale = scaleY;
    }
    let width = Math.floor(trail.width * scale);
    let height = Math.floor(trail.height * scale);
    if (width < 0) {
      return null;
    }
    if (height < 0) {
      return null;
    }
    return (
      <svg
        className="trails-svg"
        height={height * 1.1}
        onClick={this.handleMiss}
        width={width * 1.1}
        xmlns="http://www.w3.org/2000/svg"
      >
        {this.renderMarkers(trail.tokens, trail.diameter, scale)}
        {this.renderBeginEndLabels(trail, scale)}
      </svg>
    );
  };

  renderCompletionContent = () => {
    if (this.props.retry === false) {
      return this.props.completedText;
    }
    return (
      <div style={{ marginTop: "10px" }}>
        <p>{this.props.retryText}</p>
        <button
          onClick={this.props.onRetry}
          style={{
            color: "white",
            background: "#333",
            border: "none",
            fontSize: "1rem",
            marginTop: "10px",
          }}
        >
          Retry
        </button>
      </div>
    );
  };

  render() {
    let trail = this.trail();
    if (!trail) {
      return null;
    } else {
      return (
        <div style={{ position: "relative", height: "100%" }}>
          <ContainerDimensions>{this.renderSVG}</ContainerDimensions>
          <PopUp
            fontSize="3em"
            onlyIf={this.state.error !== ""}
            theme={Theme.error}
            width={trail.width}
          >
            {this.props.errorText}
          </PopUp>
          <PopUp
            onlyIf={this.props.progress >= trail.tokens.length}
            theme={Theme.success}
            retry={this.props.retry}
            width={trail.width}
          >
            {this.renderCompletionContent()}
          </PopUp>
        </div>
      );
    }
  }
}
