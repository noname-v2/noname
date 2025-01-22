import { rollup } from 'rollup';

/**
 * Bundle sources into single files.
 */
async function bundle(input, output, format='iife') {
	console.log('packing', input);
    
	const bundle = await rollup({
		input: `build/${input}.js`,
	});
    
    await bundle.write({format, file: `${output}.js`});
}

// bundle sources
await bundle('client/index', 'dist/client');
await bundle('client/service', 'dist/service');
await bundle('worker/index', 'dist/worker');
