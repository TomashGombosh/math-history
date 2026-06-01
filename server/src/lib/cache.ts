import type { AppConfig } from '@config/types';

/** Test harness cache handle; extend when adding Redis or similar. */
export function getCache(_config: AppConfig): { disconnect: () => void } {
	return {
		disconnect: () => {},
	};
}
