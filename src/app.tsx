import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoslingComponent, GoslingRef, GoslingSpec } from 'gosling.js';
import type { OverlaidTrack, SingleTrack } from 'gosling.js/dist/src/core/gosling.schema';
import GoslingSchema from './gosling.schema.json';
import InitSpec from './spec.light.json';
import { removeItemFromArray } from './utils/array';
import { getTrack } from './tracks';
import { Tileset as _Tileset } from './core/data-loader';
import { Recommendations } from './core/recommendations'

/**
 * Tileset information that also includes the link to the server
 */
export type Tileset = _Tileset & {
	/**
	 * Full URL of the server (e.g., https://server.gosling-lang.org/api/v1/)
	 */
	server: string;
}

// TODO: Circular tracks are not supported
// TODO: Better way to infer these?
type LinearTrackShape = { [key in 'x' | 'y' | 'width' | 'height']: number };
type TrackInfo = { id: string, spec: SingleTrack | OverlaidTrack, shape: LinearTrackShape };

const COMMON_PADDING = 20;
const PANNER_INNER_PADDING = '14px';
const DATATYPES = ['bigwig', 'multivec']; // TODO: Better way to infer these?

const BUTTON_STYLE = 'border-[1px] border-black';
const MARKS = GoslingSchema.definitions.Mark.enum.filter(_ => _ !== 'header');
const FIELDTYPE = GoslingSchema.definitions.FieldType.enum;
const MULTIVEC_FIELDS = ['start', 'end', 'position', 'value', 'category'];

function App() {
	const gosRef = useRef<GoslingRef>(null);
	const [spec, setSpec] = useState(InitSpec as GoslingSpec);
	const [mouseOverTrack, setMouseOverTrack] = useState<TrackInfo>();
	const [trackInfos, setTrackInfos] = useState<TrackInfo[]>([]);
	const [selectedTrackId, setSelectedTrackId] = useState<string>();
	const [selectedData, setSelectedData] = useState({ type: undefined, url: undefined });
	const [selectedMark, setSelectedMark] = useState(null);

	const [compatibleDatasets, setCompatibleDatasets] = useState<Tileset[]>([]);
	const [servers, setServers] = useState([
		'https://server.gosling-lang.org/api/v1/',
		'http://higlass.io/api/v1/',
		'https://resgen.io/api/v1/gt/paper-data/'
	].slice(0, 2));

	/**
	 * Get a list of compatible tilesets from HiGlass servers.
	 */
	async function getCompatibleTilesets() {
		const compatibleTiles = ['vector', 'multivec', 'bedlike', 'gene-annotation', 'matrix'];
		const all: Tileset[] = [];
		for(const server of servers) {
			const base = `${server}tilesets/?limit=99999`;
			const url = base + ['', ...compatibleTiles].join('&dt=');
			const response = await fetch(url);
			if(!response.ok) { 
				console.warn('Error getting tilesets from HiGlass servers');
				return;
			}
			const { results } : { results: Tileset[] } = await response.json();
			const tilesets = results.map(d => { return { ...d, server }});
			all.push(...tilesets);
		}
		setCompatibleDatasets(all.sort((a, b) => a.datatype < b.datatype ? 1 : -1));
	};

	useEffect(() => {
		getCompatibleTilesets();
	}, [servers]);

	const availableDatasets = useMemo(() => {
		return (
			<>
				<div className='p-3 h-[50px]'>
					Total <b>{compatibleDatasets.length}</b> compatible datasets found from <b>{2}</b> higlass servers and <b>{0}</b> file servers.
				</div>
				<div>
					<table className='w-full table-auto border-collapse'>
						<thead className='sticky top-0 border-collapse'>
							<tr className='h-[40px] bg-[#F0F0F0] border-collapse'>
								<td className='p-2'>Servers Plugged In</td>
								<td></td>
							</tr>
						</thead>
						<input id='server-input' type="text" className="w-full h-10 p-3" placeholder='Add server here...' onKeyDown={e => {
							const newServer = e.currentTarget.value.replaceAll(' ', '');
							if(e.key === 'Enter' && servers.indexOf(newServer) === -1) {
								setServers([...servers, e.currentTarget.value]);
								e.currentTarget.value = '';
							}
						}}/>
						<tbody>
						{servers.map(server => (
							<tr className='border border-[#F0F0F0] h-[40px]'>
								<td className='p-2'>{server}</td>
								<td><button onClick={() => setServers(removeItemFromArray(servers, servers.indexOf(server)))}>X</button></td>
							</tr>
						))}
						</tbody>
					</table>
				</div>
				<div className='flex-1 overflow-scroll'>
					<table className='w-full table-auto border-collapse'>
						<thead className='sticky top-0 border-collapse'>
							<tr className='h-[40px] bg-[#F0F0F0] border-collapse'>
								<td></td>
								<td className='p-2'>Name</td>
								<td className='p-2'>Data Type</td>
							</tr>
						</thead>
						<tbody>
						{compatibleDatasets.map(d => (
							<tr className='border border-[#F0F0F0] h-[40px]' onClick={e => {
								const track = getTrack(d);
								if(track)
								setSpec({ views: [...spec.views, { tracks: [track] }]});
							}}>
								<td className='p-2'>
									<input type="checkbox" className="w-4 h-4 focus:ring-blue-500 focus:ring-2"/>
								</td>
								<td className='p-2 max-w-[300px]'>{d.name}</td>
								<td className='p-2'>{d.datatype.replace('gene-annotation', 'gene')}</td>
							</tr>
						))}
						</tbody>
						<tr>
							<td colSpan={3} className=' sticky bottom-0 h-[40px] bg-[#F0F0F0] border-collapse'>
								Total <b>{compatibleDatasets.length}</b> compatible datasets
							</td>
						</tr>
					</table>
				</div>
			</>
		);
	}, [compatibleDatasets, spec]);

	const gosViewWidgets = useMemo(() => {
		const view = trackInfos.find(d => d.id === selectedTrackId)?.spec;

		if(!view) return;

		return (
			<>
				{/* DATA */}
				<form className={`bolder-black-500`}>
					<h1 className={`text-lg font-medium`}>Data</h1>
					<span className='block'>Type</span>
					<select className='text-underline' value={selectedData.type} onChange={(e) => setSelectedData({...selectedData, type: e.target.value })}>
						{DATATYPES.map(d => <option key={d} value={d}>{d}</option>)}
					</select>
					
					<span className="block">URL</span>
					<input className="border-1 border-black-500 block w-full" value={selectedData.url}
						onChange={(e) => setSelectedData({...selectedData, url: e.target.value})}
					></input>
					
					<div 
						className={'rounded-full bg-sky-500 text-white px-2 py-1 w-[100px] text-center cursor-pointer'} 
						onClick={() => {
							if(!selectedData.type || !selectedData.url) return;

							const selectedIndex = trackInfos.findIndex(d => d.id === selectedTrackId);
							let selectedTrack = trackInfos[selectedIndex].spec;

							const diffData = selectedTrack.data.type !== selectedData.type;
							selectedTrack.data = {...selectedData} as any;
							if(selectedTrack?.data?.type === 'multivec') {
								selectedTrack.data = {
									...selectedTrack.data,
									categories: ["sample 1", "sample 2", "sample 3", "sample 4"],
            						binSize: 16
								}
							} else if(selectedTrack?.data?.type === 'bigwig') {
								selectedTrack.data = {
									...selectedTrack.data,
									binSize: 8
								}
							}
							if(diffData) {
								if(selectedTrack?.data?.type === 'multivec') {
									selectedTrack = {...selectedTrack,
										"x": {"field": "start", "type": "genomic", "axis": "none"},
										"xe": {"field": "end", "type": "genomic", "axis": "none"},
										"y": {"field": "value", "type": "quantitative"},
										"color": {"field": "category", "type": "nominal", "legend": true},
									};
								} else {
									selectedTrack = {...selectedTrack,
										"x": {"field": "start", "type": "genomic", "axis": "none"},
										"xe": {"field": "end", "type": "genomic"},
										"y": {"field": "value", "type": "quantitative", "axis": "none"},
										"color": { "value": "#E79F00" }
									};
								}
							}
							// console.log(selectedTrack);
							if(selectedIndex === 0) {
								setSpec({
									views: [
										{ tracks: [{ ...selectedTrack }]},
										spec.views[1]
									]
								});
							} else {
								setSpec({
									views: [
										spec.views[0],
										{ tracks: [{ ...selectedTrack }]},
									]
								});
							}
						}}>
							Update
					</div>
				</form>
				{/* MARK */}
				<div>
					<h1 className={`text-lg font-medium mt-5`}>Encoding</h1>
					<select value={selectedMark} onChange={(e) => {
						const selectedIndex = trackInfos.findIndex(d => d.id === selectedTrackId);
						let selectedTrack = trackInfos[selectedIndex].spec;
						selectedTrack.mark = e.target.value as any;
						setSelectedMark(e.target.value);
						// console.log(selectedTrack);
						if(selectedIndex === 0) {
							setSpec({
								views: [
									{ tracks: [{ ...selectedTrack }]},
									spec.views[1]
								]
							});
						} else {
							setSpec({
								views: [
									spec.views[0],
									{ tracks: [{ ...selectedTrack, id: undefined }]},
								]
							});
						}
					}}>
						{MARKS.map(d => <option key={d} value={d}>{d}</option>)}
					</select>
				</div>
				{/* COLOR */}
				{/* <div>
					<h3>Color</h3>
					<select value={spec.views[0].tracks[0].color?.type} onChange={(e) => {setSpec({
						...spec,
						views: [{ ...spec.views[0], tracks: [{...spec.views[0].tracks[0], color: { ...spec.views[0].tracks[0].color, type: e.currentTarget.value }}]}]
					})}}>
						{FIELDTYPE.map(d => <option key={d} value={d}>{d}</option>)}
					</select>
					<select value={spec.views[0].tracks[0].color?.field} onChange={(e) => {setSpec({
						...spec,
						views: [{ ...spec.views[0], tracks: [{...spec.views[0].tracks[0], color: { ...spec.views[0].tracks[0].color, field: e.currentTarget.value }}]}]
					})}}>
						{MULTIVEC_FIELDS.map(d => <option key={d} value={d}>{d}</option>)}
					</select>
				</div> */}
				{/* <div style={{ marginTop: 30, marginLeft: 80 }}>
					{'Height: '}
					<input
						type="range"
						min={100}
						max={500}
						step={10}
						// value={binSize}
						className="slider"
						id="bin-slider"
						style={{ width: 100, display: 'inline', margin: 10 }}
						onChange={(e) => setSpec({
							...spec,
							views: [{ ...spec.views[0], tracks: [{...spec.views[0].tracks[0], height: +e.currentTarget.value}]}]
						})}
					/>
				</div> */}
			</>
		);
	}, [spec, selectedTrackId, selectedData, selectedMark]);

	// DEBUG
	useEffect(() => {
		console.warn(spec);
	}, [spec]);

	useEffect(() => {
		if(!gosRef.current) return;

		setTrackInfos(gosRef.current.api.getTracks().filter(d => d.spec.mark !== 'header'));
		// console.log(expandSchema());
		// gosRef.current.api.subscribe('trackMouseOver', (_, data) => {
		// 	if(data.id !== mouseOverTrack?.id) {
		// 		// different track
		// 		setMouseOverTrack(data as TrackInfo);
		// 	}
		// });
		return () => {
			// gosRef.current?.api.unsubscribe('trackMouseOver');
		}
	}, [gosRef.current]);

	useEffect(() => {
		const selected = trackInfos.find(d => d.id === selectedTrackId);
		if(!selected) return;
		
		// console.log(Object.getOwnPropertyNames(selected.spec.x));
		const selectedTrack = trackInfos.find(d => d.id === selectedTrackId)?.spec;
		setSelectedData({ type: selectedTrack?.data?.type, url: selectedTrack?.data.url });
		setSelectedMark(selectedTrack?.mark);
		// console.log(selectedTrack);
		// const d = rjsf.utils.getDefaultFormState(GoslingSchema, spec, GoslingSchema, true);
		// const test = rjsf.utils.retrieveSchema(GoslingSchema, GoslingSchema, spec);
		// console.log(d);
		// console.log(test, GoslingSchema);
	}, [selectedTrackId]);

	return (
		<div className='h-full bg-[#F5F5F5]'>
			<nav className="flex items-center justify-between flex-wrap bg-[#E18241] h-[5px]"></nav>
			<div className="flex flex-col w-full h-[100%] divide-y divide-solid">
				<div className="flex-1 flex flex-row overflow-hidden divide-x divide-solid divide-[#DADADA]">
					<div className={`flex-1 p-[${PANNER_INNER_PADDING}]`}>
						<div className='w-full h-full bg-[white] overflow-hidden flex flex-col'>
							{availableDatasets}
						</div>
					</div>
					{/* <textarea className='flex-1 p-5 bg-[black] text-gray-500 resize-none' readOnly value={stringify(spec)}/> */}
					{/* <div className={`flex-none w-[400px] p-[${PANNER_INNER_PADDING}]`}>
						<div className={`overflow-scroll h-full bg-[white] p-[20px]`}>
							{Templates.map(d => <div>
								<h3 className='font-bold'>{d.name}</h3>
								<img src={d.thumbnail}></img>
							</div>)}
						</div>
					</div> */}
					<div className={`flex-1 p-[${PANNER_INNER_PADDING}]`}>
						<div className='w-full h-full bg-[white] overflow-scroll p-[20px]'>
							<GoslingComponent
								ref={gosRef}
								spec={spec}
								margin={0}
								padding={0}
								// theme={theme}
								// experimental={{ reactive: true }}
							/>
							{trackInfos.map((d, i) => <div key={d.id} className={
								`
								absolute
								cursor-pointer
								left-[${d.shape.x + COMMON_PADDING}px]
								top-[${d.shape.y + COMMON_PADDING}px]
								w-[${d.shape.width}px]
								h-[${d.shape.height}px]
								${d.id === selectedTrackId ? 'outline' : 'hover:outline'}
								outline-[2px]
								outline-offset-2
								outline-${d.id === selectedTrackId ? '[#188FFF]' : '[lightgrey]'}
								`
							} onClick={() => {
								setSelectedTrackId(selectedTrackId === d.id ? undefined : d.id);
							}}/>)}
						</div>
					</div>
					<div className={`flex-1 p-[${PANNER_INNER_PADDING}]`}>
						<div className={`w-full h-full bg-[white] overflow-scroll p-[${COMMON_PADDING}px]`}>
							{gosViewWidgets}
							{/* TRACK REMOVE */}
							{/* <button className={BUTTON_STYLE} onClick={() => {setSpec({
								...spec,
								views: spec.views.filter(d => d.tracks[0].id !== 'track-1') as any
							})}}>Remove</button> */}
							{/* {stringify(trackInfos.find(d => d.id === selectedTrackId)?.spec.data, { indent: 4 })} */}
						</div>
						{/* <label className="inline-flex relative items-center cursor-pointer">
							<input type="checkbox" value="" id="default-toggle" className="sr-only peer"/>
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							<span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Toggle me</span>
						</label> */}
					</div>
				</div>
			</div>
			<Recommendations 
				left={500}
				top={500}
				visible={selectedTrackId !== undefined}
			/>
		</div>
	);
}

export default App;