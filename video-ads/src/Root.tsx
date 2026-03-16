import { Composition } from 'remotion';
import { AdShowcase } from './AdShowcase';

export const Root: React.FC = () => {
	return (
		<>
			<Composition
				id="AdShowcase"
				component={AdShowcase}
				durationInFrames={1140}
				fps={30}
				width={1080}
				height={1920}
			/>
		</>
	);
};
