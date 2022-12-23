import type {StillImageFormat} from '@remotion/renderer';
import React, {
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
	useState,
} from 'react';
import type {TCompMetadata} from 'remotion';
import {getDefaultOutLocation} from '../../../get-default-out-name';
import {Button} from '../../../preview-server/error-overlay/remotion-overlay/Button';
import {ModalsContext} from '../../state/modals';
import {Spacing} from '../layout';
import {ModalContainer} from '../ModalContainer';
import {NewCompHeader} from '../ModalHeader';
import {RemotionInput} from '../NewComposition/RemInput';
import {addRenderJob} from '../RenderQueue/actions';
import {leftSidebarTabs} from '../SidebarContent';

type State =
	| {
			type: 'idle';
	  }
	| {
			type: 'success';
	  }
	| {
			type: 'load';
	  }
	| {
			type: 'error';
	  };

const initialState: State = {type: 'idle'};

type Action =
	| {
			type: 'start';
	  }
	| {
			type: 'succeed';
	  }
	| {
			type: 'fail';
	  };

const reducer = (state: State, action: Action): State => {
	if (action.type === 'start') {
		return {
			type: 'load',
		};
	}

	if (action.type === 'fail') {
		return {
			type: 'error',
		};
	}

	if (action.type === 'succeed') {
		return {
			type: 'success',
		};
	}

	return state;
};

const container: React.CSSProperties = {
	padding: 20,
};

const row: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
};

const label: React.CSSProperties = {
	width: 150,
	fontSize: 14,
};

const rightRow: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-end',
	flex: 1,
};

const buttonRow: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-end',
};

const input: React.CSSProperties = {
	minWidth: 250,
};

export const RenderModal: React.FC<{composition: TCompMetadata}> = ({
	composition,
}) => {
	const {setSelectedModal} = useContext(ModalsContext);

	const onQuit = useCallback(() => {
		setSelectedModal(null);
	}, [setSelectedModal]);

	const isMounted = useRef(true);

	const [state, dispatch] = useReducer(reducer, initialState);

	const [imageFormat, setImageFormat] = useState<StillImageFormat>('png');
	const [outName, setOutName] = useState(() =>
		getDefaultOutLocation({
			compositionName: composition.id,
			defaultExtension: imageFormat,
		})
	);

	const dispatchIfMounted: typeof dispatch = useCallback((payload) => {
		if (isMounted.current === false) return;
		dispatch(payload);
	}, []);

	const onValueChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
		(e) => {
			setOutName(e.target.value);
		},
		[]
	);

	const setPng = useCallback(() => {
		setImageFormat('png');
		setOutName((prev) => {
			if (prev.endsWith('.jpeg') || prev.endsWith('.jpg')) {
				return prev.replace(/.jpe?g$/g, '.png');
			}

			return prev;
		});
	}, []);

	const setJpeg = useCallback(() => {
		setImageFormat('jpeg');
		setOutName((prev) => {
			if (prev.endsWith('.png')) {
				return prev.replace(/.png$/g, '.jpeg');
			}

			return prev;
		});
	}, []);

	const onClick = useCallback(() => {
		leftSidebarTabs.current?.selectRendersPanel();
		addRenderJob({
			composition,
			outName,
		})
			.then(() => {
				dispatchIfMounted({type: 'succeed'});
				setSelectedModal(null);
			})
			.catch(() => {
				dispatchIfMounted({type: 'fail'});
			});
	}, [composition, dispatchIfMounted, outName, setSelectedModal]);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	return (
		<ModalContainer onOutsideClick={onQuit} onEscape={onQuit}>
			<NewCompHeader title={`Render ${composition.id}`} />
			<div style={container}>
				<div style={row}>
					<div style={label}>Format</div>
					<div style={rightRow}>
						<button type="button" onClick={setPng}>
							PNG
						</button>
						<button type="button" onClick={setJpeg}>
							JPEG
						</button>
					</div>
				</div>
				<Spacing block y={0.5} />
				<div style={row}>
					<div style={label}>Output name</div>
					<div style={rightRow}>
						<RemotionInput
							style={input}
							type="text"
							value={outName}
							onChange={onValueChange}
						/>
					</div>
				</div>
				<Spacing block y={0.5} />
				<div style={buttonRow}>
					<Button onClick={onClick} disabled={state.type === 'load'}>
						{state.type === 'idle' ? 'Render' : 'Rendering...'}
					</Button>
				</div>
			</div>
		</ModalContainer>
	);
};
