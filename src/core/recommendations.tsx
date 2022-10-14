import React, { useEffect, useMemo, useRef, useState } from 'react';

export function Recommendations(props: {
    top: number,
    left: number,
    visible: boolean
}) {
	return (
		<div className={`
            z-0
            fixed
            border-grey
            left-[${props.left}px]
            top-[${props.top}px]
            ${props.visible ? 'visible' : 'invisible'}
            min-w-[100px]
            min-h-[100px]
            bg-[lightgrey]
        `}>
            recommendation...
		</div>
	);
}