import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import { Button } from '@blueprintjs/core';
import Radium from 'radium';
import Phone from 'react-phone-number-input';
import { postUser, postUserAuthentication, getReferralDetails, getCallWithVerificationCode } from './actions';
import HowToPlay from './HowToPlay';
import Invite from '../User/Invite';
import Scrollchor from 'react-scrollchor';
import MediaQuery from 'react-responsive';
import { Dialog } from '@blueprintjs/core';
import { getScore } from '../../Utilities/UserUtils'

let styles;

export const Landing = React.createClass({
	propTypes: {
		landingData: PropTypes.object,
		location: PropTypes.object,
		params: PropTypes.object,
		dispatch: PropTypes.func,
	},

	getInitialState() {
		return {
			name: '',
			phone: '',
			zipcode: '',
			error: undefined,
			signupCode: '',
			showAuthenticationPanel: false,
		};
	},

	componentWillMount() {
		this.loadData(this.props.location.query.ref);
	},

	componentWillReceiveProps(nextProps) {
		const lastLoading = this.props.landingData.signupLoading;
		const nextLoading = nextProps.landingData.signupLoading;
		const nextError = nextProps.landingData.signupError;
		// const nextResult = nextProps.landingData.signupResult;
		// If the phone number is already in use
		// if (lastLoading && !nextLoading && !nextError && nextResult.id) {
		if (lastLoading && !nextLoading && !nextError) {
			this.setState({ showAuthenticationPanel: true });
			// localStorage.setItem('userData', JSON.stringify(nextResult));
			// browserHistory.push(`/${nextResult.id}`);
		}

		const lastAuthLoading = this.props.landingData.authenticationLoading;
		const nextAuthLoading = nextProps.landingData.authenticationLoading;
		const nextAuthError = nextProps.landingData.authenticationError;
		const nextAuthResult = nextProps.landingData.authenticationResult;
		if (lastAuthLoading && !nextAuthLoading && !nextAuthError && nextAuthResult.id) {
			this.setState({ showAuthenticationPanel: false });
			localStorage.setItem('userData', JSON.stringify(nextAuthResult));
			browserHistory.push(`/${nextAuthResult.id}`);
		}
	},
	
	updateZipcode: function(evt) {
		this.setState({
			zipcode: evt.target.value.substring(0, 5)
		});
	},

	signupSubmit: function(evt) {
		evt.preventDefault();
		const refUser = this.props.landingData.referralDetails || {};
		const referral = refUser.id || this.props.location.query.ref;
		this.props.landingData.referralDetails
		if (!this.state.name) { return this.setState({ error: 'Name required' }); }
		if (!this.state.zipcode) { return this.setState({ error: 'Zipcode required' }); }
		if (this.state.zipcode.length !== 5) { return this.setState({ error: 'Zipcode must be 5 digits' }); }
		if (!this.state.phone) { return this.setState({ error: 'Phone Number required' }); }
		this.setState({ error: undefined });
		return this.props.dispatch(postUser(this.state.name, this.state.phone, this.state.zipcode, referral, window.variant));
	},

	authenticationSubmit: function(evt) {
		evt.preventDefault();
		if (!this.state.signupCode) { return this.setState({ error: 'Signup Code required' }); }
		
		this.setState({ error: undefined });
		return this.props.dispatch(postUserAuthentication(this.state.phone, this.state.signupCode));
	},

	callWithVerificationCode: function(evt) {
		evt.preventDefault();
		return this.props.dispatch(getCallWithVerificationCode(this.state.phone));
	},

	closeAuthenticationPanel: function() {
		this.setState({ showAuthenticationPanel: false });
	},

	loadData(userId) {
		if (userId) {
			this.props.dispatch(getReferralDetails(userId));
		}
	},

	render() {
/* 
	Still to do: 
	* Form verification [done]
	* Re-insert 
	  <div style={styles.headerImage} />
	  <div style={styles.headerSplash} /> ?
*/
		const refUser = this.props.landingData.referralDetails;
		const error = this.state.error || this.props.landingData.signupError;
		const authError = this.state.error || this.props.landingData.authenticationError;
        const localUserData = localStorage.getItem('userData');
        const localUser = localUserData && localUserData.length > 1 ? JSON.parse(localUserData) : {};
        const localUserScore = localUser? getScore(localUser): 0;

        const inviteForm = (
			<div style={{padding: '1.6em'}}>
				<div style={styles.headerCall} className={'pt-card pt-elevation-3'}>
					<div style={{paddingBottom:'1em'}}>
						<Link to={`/${localUser.id}`} >
							<Button style={styles.button}
									text={'Call Your Representatives'}
									className={'pt-intent-danger pt-fill pt-large'}/>
						</Link>
					</div>
					<Invite url={`https://fiftynifty.org/?ref=${localUser.id}`}/>
				</div>
			</div>
		);
        const refText = refUser && <div style={{textAlign:'center'}}><div style={styles.headerText}>{refUser.name} Invited You</div></div>
        const joinForm = (
			<div style={{padding: '1.6em'}}>
				<div id="join" style={styles.headerCall} className={'pt-card pt-elevation-3'}>
                    { refText }
					<div style={styles.inputHeader}> Join The Challenge</div>
					<form onSubmit={this.signupSubmit} style={styles.form}>
						<label htmlFor={'name-input'} style={styles.inputLabel}>
							Name
							<input id={'name-input'} className={'pt-input pt-large pt-fill'}
								   placeholder={'Nicknames are okay'} value={this.state.name}
								   onChange={(evt) => this.setState({name: evt.target.value})}/>
						</label>
						<label htmlFor={'zip-input'} style={styles.inputLabel}>
							Zipcode (where you vote)
							<input id={'zip-input'} type={'number'} className={'pt-input pt-large pt-fill'}
								   placeholder={'Where are you registered?'} value={this.state.zipcode}
								   onChange={this.updateZipcode}/>
						</label>
						<label htmlFor={'phone-input'} style={styles.inputLabel}>
							Phone number (to connect you to your reps)
							<Phone country={'US'} className={'pt-input pt-large pt-fill'}
								   placeholder={'Enter your phone number'} value={this.state.phone}
								   onChange={phone => this.setState({phone: phone})}/>
							<div style={styles.inputSubtext}><span style={{ verticalAlign: 'middle', fontSize: '0.85em', opacity: 0.7 }} className={'pt-icon-standard pt-icon-lock'} /> Encrypted. We never sell or share your number.</div>
						</label>
						<Button
							loading={this.props.landingData.signupLoading}
							type={'submit'} style={styles.button}
							text={'Join the Challenge'}
							className={'pt-intent-primary pt-fill pt-large'}
							onClick={this.signupSubmit}/>
						<div style={styles.error}>{error}</div>
					</form>
				</div>
			</div>
        );
        const joinNowButton = (
			<div style={{width: '100%', textAlign: 'center'}}>
				<div >
					<Scrollchor to="#join"><Button
						role={"button"}
						className={'pt-fill pt-button pt-intent-primary'}>Join Now</Button>
					</Scrollchor>
				</div>
			</div>
		);
		return (
			<div style={styles.container}>
				<div style={styles.header}>
					<div style={styles.headerImage} />
					<div style={styles.headerSplash} />
					<div style={styles.headerPresentation}>
						<div style={styles.headerTextBlock}>
							<div style={styles.section}>
								<div style={styles.headerText}>Call your Reps!</div>
								<div style={styles.headerText}>Make 3 calls, your friends do the rest</div>
								<div style={styles.headerText}>Play for a better Democracy!</div>
							</div>
							{variant <= 50 &&
								
								<p style={styles.headerTextBody}>President Trump’s Executive Order “Protecting the Nation from Foreign Terrorist Entry into the United States” has created a great deal of discussion. For your opinion to have impact, call your Congressional representatives and get your friends to do the same.  Live calls matter, so you are invited to join the FiftyNifty Challenge to build a network of 50 people in 50 states to call Congress directly and multiply their message.  The network with the most calls wins the Challenge, but we all win when we call for an effective democracy.  Read on to see how to win and hints to make your call easy and effective.</p>
							}

							{variant > 50 && 
								<p style={styles.headerTextBody}>Real phone calls from real constituents matter to elected officials. The Fifty Nifty Challenge is your chance to build a grassroots social network for action. Your goal is to get 50 people in 50 states to directly tell their congresspeople what they think. The network that makes the most calls wins and we all win when we call for an effective democracy. It’s a challenge for you and your friends, and a chance to watch the growth of your network. You can call about any issue of importance to you and we’ll suggest one when you learn more. Read on to see how to win and hints about what to say.</p>
							}
							
							{localUser.id && <Link to={`/${localUser.id}`}> <div style={styles.welcomeLine}>Welcome {localUser.name}, Click here to see your progress</div></Link>}
						</div>
						<MediaQuery query='(max-width: 767px)'>
							{!localUser.id && refText}
                            {!localUser.id && joinNowButton}
						</MediaQuery>
                        {!!localUser.id && inviteForm}
						<MediaQuery query='(min-width: 767px)'>
                            {!localUser.id && joinForm}
						</MediaQuery>

					</div>
				</div>
				<HowToPlay localUser={localUser}/>

				<MediaQuery query='(max-width: 767px)'>
					<div style={styles.joinMobileBackground}>
                        {!localUser.id && joinForm}
					</div>
				</MediaQuery>

				<Dialog isOpen={this.state.showAuthenticationPanel} onClose={this.closeAuthenticationPanel} title={'Authenticate your Phone number'} style={styles.dialogBox}>
					<div className="pt-dialog-body">
						<p>We've just sent you a text message with an authentication code. Please enter the numeric code here.</p>
						<form onSubmit={this.authenticationSubmit} style={styles.form}>
							<label htmlFor={'code-input'} style={styles.inputLabel}>
								<input id={'code-input'} type={'number'}  className={'pt-input pt-large pt-fill'}
									   placeholder={'Authentication Code'} value={this.state.signupCode}
									   onChange={(evt) => this.setState({signupCode: evt.target.value})}/>
							</label>
							<Button
								loading={this.props.landingData.authenticationLoading}
								type={'submit'} style={styles.button}
								text={'Submit Authentication Code'}
								className={'pt-intent-primary pt-fill pt-large'}
								onClick={this.authenticationSubmit}/>
							<div style={styles.error}>{authError}</div>
							<Button
								loading={this.props.landingData.authenticationLoading}
								type={'submit'} style={styles.button}
								text={'Landline? Click for a call with your code'}
								className={'pt-intent-primary pt-fill pt-large'}
								onClick={this.callWithVerificationCode}/>
						</form>
					</div>
				</Dialog>


			</div>
		);
	}
});

function mapStateToProps(state) {
	return {
		landingData: state.landing.toJS(),
	};
}

export default connect(mapStateToProps)(Radium(Landing));

styles = {
	container: {
		maxWidth:'100vw',
	},
	header: {
		position: 'relative',		
	},
	headerImage: {
		backgroundImage: 'url("/static/hands.jpg")',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center center',
		backgroundSize: 'cover',
		position: 'absolute',
		width: '100%',
		height: '100%',
		zIndex: 1,
		top: 0,
		left: 0,
	},
	headerSplash: {
		position: 'absolute',
		// backgroundColor: 'rgba(19, 24, 187, 0.7)',
		// backgroundImage: 'url("/static/denim.png")',
		backgroundColor: '#003D59',
		opacity: 0.8,
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		zIndex: 1,
	},
	headerPresentation: {
		//backgroundColor: '#cb0027',
		position: 'relative',
		zIndex: 2,
		padding: 'calc(115px + 1em) 1em 3em',
		maxWidth: '1024px',
		margin: '0 auto',
		width: '100%',
		display: 'table',
		'@media screen and (min-resolution: 3dppx), screen and (max-width: 767px)': {
			display: 'block',
		},
	},
	headerTextBlock: {
		color: 'white',
		display: 'table-cell',
		paddingRight: '2em',
		'@media screen and (min-resolution: 3dppx), screen and (max-width: 767px)': {
			display: 'block',
			width: '100%',
			padding: '0.5em',
		},
	},
	headerText: {
		maxWidth: '500px',
		// color: '#cb0027',
		color: '#da0f18',
		fontSize: '1.8em',
        fontFamily: 'mrs-eaves-roman-small-caps, sans-serif',
        fontWeight: 'bold',

    '@media screen and (min-resolution: 3dppx), screen and (max-width: 767px)': {
			textAlign: 'center',
			maxWidth: '100%',
		},
	},
	headerTextBody: {
		maxWidth: '500px',
		padding: '1em 1em',
		fontSize: '1em',
		lineHeight: '1.5',
		textAlign: 'justify',
		'@media screen and (min-resolution: 3dppx), screen and (max-width: 767px)': {
			maxWidth: '100%',
		},
		fontWeight: '200',
		color: 'white',
	},
	headerCall: {
		display: 'table-cell',
		backgroundColor: 'white',
		position: 'relative',
		zIndex: 2,
		fontWeight: '200',
		'@media screen and (min-resolution: 3dppx), screen and (max-width: 767px)': {
			display: 'block',
			width: '100%',
			padding: '1em',
		},

		// padding: '2rem 1rem',
		// maxWidth: '1024px',
		// margin: '0 auto',
		// float: 'right',
	},
	inputHeader: {
		fontSize: '1.4em',
		display: 'block',
		marginBottom: '1em',
		textAlign: 'center'
	},
	inputLabel: {
		fontSize: '1.25em',
		display: 'block',
		marginBottom: '1em',
	},
	inputSubtext: {
		fontSize: '0.85em',
		opacity: 0.7,
		paddingTop: '0.25em',
	},
	button: {
		verticalAlign: 'bottom',
	},
	learnMoreButton: {
		width: '40%',
		display: 'table-cell',
		textDecoration: 'none',
		textAlign: 'center',
		padding: '0.5em 1em',
	},
	section: {
		padding: '2em 1em',
		maxWidth: '1024px',
		margin: '0 auto',
	},
	form: {
		padding: 0,
		margin: 0,
	},
	sectionHeader: {
		fontSize: '2em',
		fontWeight: '600',
		marginBottom: '1.5em',
		textAlign: 'center',
		//color: 'white'
	},
	smallInformation: {
		fontSize: '0.75em',
		width: '100%',
		marginTop: '0.5em',
		padding: '0.3em 0.3em',
		clear: 'both',
	},
	smallInformationText: {
		float: 'right',
		width: '90%',
	},
	lockImage: {
		height: '1em',
		position: 'relative',
		top: '0.2em',
	},
	iconsTable: {
		display: 'table',
		width: '100%',
		textAlign: 'center'
	},
	howToPlaySection: {
		display: 'table-cell',
		width: '40%,',
		textAlign: 'center',
		padding: '1em',
	},
	error: { 
		color: 'rgb(203, 0, 39)',
		fontSize: '1.25em',
		paddingTop: '.5em',
	},
	joinMobileBackground:{
        backgroundImage: 'url("/static/hands.jpg")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
		maxWidth: '100%',
        boxShadow: 'inset 0 0 0 100vw rgba(0,61,89,.6)',
	},
	dialogBox: {
        maxWidth: '100%',
        top: '10%',
    },
    welcomeLine: {
		textAlign:'center',
		padding:'1em',
		fontWeight:'bold',
        color: '#da0f18',
		background: 'rgba( 255, 255, 255, 0.6)',
		borderRadius: '5px',
		letterSpacing:'0.05em',
	}
};
