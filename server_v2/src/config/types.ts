export type NodeEnv = 'test' | 'local' | 'dev' | 'development' | 'stage' | 'production' | 'prod';

export interface AppConfig {
	nodeEnv: NodeEnv;
}
