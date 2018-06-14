import React from 'react';
import PropTypes from 'prop-types';
import Styles from './styles';
import Theme from './theme';
import Marker from './marker';
import PopUp from './popup';
import TrailsA from './trails_a';
import TrailsB from './trails_b';
import TrailsA12 from './trails_a_12';
import TrailsB12 from './trails_b_12';
import TrailTypes from './trail_types';
import ContainerDimensions from 'react-container-dimensions';

export default class Trails extends React.PureComponent {

	static propTypes = {
		part: PropTypes.string.isRequired,
		feedback: PropTypes.bool,
		progress: PropTypes.number,
		errorText: PropTypes.string,
		errorDuration: PropTypes.number,
		completedText: PropTypes.string,
		onSuccess: PropTypes.func,
		onError: PropTypes.func,
		onCompleted: PropTypes.func,
		onMiss: PropTypes.func
	}

	static defaultProps = {
		part: "A",
		feedback: true,
		errorText: "X",
		errorDuration: 500,
		completedText: "Completed!",
		progress: 0,
		onSuccess: (date, token) => {},
		onError: (date, correctToken, selectedToken) => {},
		onCompleted: (date) => {},
		onMiss: (date, correctToken, x, y) => {}
	}

	state = {
		error: "",
	}

	constructor(props) {
		super(props);
		this.timeout = undefined;
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
		if (this.props.progress > trail.tokens.length) {
			this.props.onCompleted(date)
		}
	}

	handleError = (e, index) => {
		let date = new Date();
		let trail = this.trail();

		// notify parent
		this.props.onError(date, trail.tokens[this.props.progress], trail.tokens[index]);

		// want event to bubble but still prevent on miss from being triggered
		this.handled = true;

		// if sending feedback, display an error showing the wrong marker was selected
		if (this.props.feedback) {
			this.setState({ error: this.props.errorText });

			// remove the error after a predetermined duration
			clearTimeout(this.timeout);
			this.timeout = setTimeout(
				() => { this.setState({ error: "" }) },
				this.props.errorDuration
			);
		}
	}

	handleMiss = (e) => {
		let date = new Date();

		// notify parent if not handled already by success or error
		if (!this.handled) {
			this.props.onMiss(date, this.trail().tokens[this.props.progress], e.nativeEvent.offsetX, e.nativeEvent.offsetY);
		}
	}

	trail = () => {
		switch (this.props.part) {
			case TrailTypes.A:
				return TrailsA;
			case TrailTypes.B:
				return TrailsB;
			case TrailTypes.A12:
				return TrailsA12;
			case TrailTypes.B12:
				return TrailsB12;
			default:
				return TrailsA;
		}
	}

	renderMarkers = (tokens, diameter, scale) => {
		let markers = [];
		for (let i = 0; i < tokens.length; i++) {
			// if correctly selected show as completed
			let theme = this.props.progress > i ?
				Theme.success :
				Theme.error;

			// if next in line to be selected handle with success
			// else handle with error
			let handler = this.props.progress == i ?
				(e) => this.handleSuccess(e, i) :
				(e) => this.handleError(e, i);

			// if finished, don't listen anymore
			if (this.props.progress >= tokens.length) {
				handler = undefined;
			}

			// add the marker keyed to the token
			markers.push(
				<Marker
					key={"trails-marker-" + tokens[i].text}
					cx={Math.floor(tokens[i].x * scale)}
					cy={Math.floor(tokens[i].y * scale)}
					r={Math.floor(diameter/2 * scale)}
					fontSize={Math.floor(diameter/2 * 8/10 * scale)}
					theme={theme}
					text={tokens[i].text}
					onClick={handler}/>);
		}
		return markers
	}

	renderSVG = (dim) => {
		let trail = this.trail();
		let scaleX = Math.floor(dim.width / trail.width * 10) / 10;
		let scaleY = Math.floor(dim.height / trail.height * 10) / 10;
		let scale = scaleX;
		if (scaleY < scaleX) {
			scale = scaleY;
		}
		let width = Math.floor(trail.width * scale) - 10;
		let height = Math.floor(trail.height * scale) - 10;
		if (width < 0) {
			return null;
		}
		if (height < 0) {
			return null;
		}
		return (<svg
			xmlns="http://www.w3.org/2000/svg"
			width={ width }
			height={ height }
			onClick={ this.handleMiss }>
			{ this.renderMarkers(trail.tokens,trail.diameter,scale) }
		</svg>);
	}

	render() {
		let trail = this.trail();
		return (
			<div style={{position:"relative", height:"100%"}}>
				<ContainerDimensions>
					{ this.renderSVG }
				</ContainerDimensions>
				<PopUp onlyIf={this.state.error !== ""} theme={Theme.error} fontSize="3em" width={trail.width}>
					{this.props.errorText}
				</PopUp>
				<PopUp onlyIf={this.props.progress >= trail.tokens.length} theme={Theme.success} width={trail.width}>
						{this.props.completedText}
				</PopUp>
			</div>
		);
	}
}