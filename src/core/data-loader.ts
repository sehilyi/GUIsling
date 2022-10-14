/**
 * Tileset information used for HiGlass data.
 */
export type Tileset = {
	uuid: string;
	datafile: string;
	filetype: string;
	datatype: string;
	name: string;
	description: string;
	private: boolean;
	project: string;
	project_name: string;
	coordSystem: string;
	coordSystem2: string;
	created: string;
}

/**
 * Get a URL to the HiGlass tileset.
 * @returns A URL string to the HiGlass tileset.
 */
export function getTilesetUrl(tileset: { server: string, uuid: string }) {
    return `${tileset.server}tileset_info/?d=${tileset.uuid}`;
}