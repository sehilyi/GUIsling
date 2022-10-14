import { Track } from 'gosling.js/dist/src/core/gosling.schema';
import { Tileset } from './app';
import { getTilesetUrl } from './core/data-loader';

export function getTrack(tileset: Tileset) : Track | undefined{
	switch(tileset.datatype) {
	case 'vector':
		return {
			data: {
				type: 'vector',
				url: getTilesetUrl(tileset),
				binSize: 16
			},
			mark: 'bar',
			x: { field: 'start', type: 'genomic' },
			xe: { field: 'end', type: 'genomic' },
			y: { field: 'value', type: 'quantitative' },
			width: 600,
			height: 80
		};
	case 'multivec':
		return {
			data: {
				type: 'multivec',
				url: getTilesetUrl(tileset),
				binSize: 16
			},
			mark: 'rect',
			x: { field: 'start', type: 'genomic' },
			xe: { field: 'end', type: 'genomic' },
			color: { field: 'value', type: 'quantitative', range: 'grey', legend: true },
			row: { field: 'category', type: 'nominal' },
			width: 600,
			height: 80
		};
	default:
		return;
	}
}