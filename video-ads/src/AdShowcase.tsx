import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
	Easing,
} from 'remotion';
import {
	User,
	Lock,
	Bot,
	Search,
	Wallet,
	Star,
	MessageSquare,
	ChevronRight,
} from 'lucide-react';

const COLORS = {
	primary: '#b91c1c', // The red from the app
	bg: '#000000',
	text: '#ffffff',
	secondaryText: '#94a3b8',
	card: '#111827',
};

const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<AbsoluteFill className="bg-black flex items-center justify-center p-8">
			<div className="relative w-full h-full bg-black rounded-[60px] border-[12px] border-[#222] shadow-2xl overflow-hidden">
				{/* Notch */}
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-[#222] rounded-b-3xl z-50" />
				{children}
			</div>
		</AbsoluteFill>
	);
};

export const AdShowcase: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Phase calculations
	const loginOpacity = interpolate(frame, [0, 20, 110, 120], [0, 1, 1, 0]);
	const chatOpacity = interpolate(frame, [115, 125], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Login animations
	const loginTranslateY = spring({
		frame,
		fps,
		from: 100,
		to: 0,
		config: { damping: 12 },
	});

	// Typing effect for "zinger under 500"
	const budgetText = "zinger under 500";
	const budgetTypingFrame = frame - 200;
	const budgetCharsVisible = Math.max(0, Math.min(budgetText.length, Math.floor(budgetTypingFrame / 2)));
	const currentBudgetText = budgetText.slice(0, budgetCharsVisible);

	// Quality mode typing
	const qualityText = "Best pizza nearby";
	const qualityTypingFrame = frame - 580;
	const qualityCharsVisible = Math.max(0, Math.min(qualityText.length, Math.floor(qualityTypingFrame / 2)));
	const currentQualityText = qualityText.slice(0, qualityCharsVisible);

	// Prompt mode typing
	const promptText = "where can I get zaiqa chai?";
	const promptTypingFrame = frame - 940;
	const promptCharsVisible = Math.max(0, Math.min(promptText.length, Math.floor(promptTypingFrame / 2)));
	const currentPromptText = promptText.slice(0, promptCharsVisible);

	// Mode selection
	const activeMode = frame < 420 ? 'budget' : frame < 780 ? 'quality' : 'prompt';

	return (
		<PhoneFrame>
			{/* Login Screen */}
			{frame < 130 && (
				<div
					style={{ opacity: loginOpacity, transform: `translateY(${loginTranslateY}px)` }}
					className="h-full flex flex-col items-center justify-center px-8 bg-black"
				>
					<div className="w-24 h-24 rounded-full border-2 border-red-700/30 flex items-center justify-center mb-8">
						<div className="w-20 h-20 bg-red-700 rounded-full flex items-center justify-center text-white text-4xl font-bold">
							F
						</div>
					</div>
					<h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
					<p className="text-slate-400 mb-12">Log in to Food Assistant</p>

					<div className="w-full space-y-4">
						<div className="relative">
							<User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
							<div className="w-full bg-[#111] border border-white/10 rounded-2xl py-5 pl-14 text-white">
								{frame > 60 ? 'demo_user' : ''}
							</div>
						</div>
						<div className="relative">
							<Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
							<div className="w-full bg-[#111] border border-white/10 rounded-2xl py-5 pl-14 text-white">
								{frame > 80 ? '••••••••' : ''}
							</div>
						</div>
						<div
							className="w-full bg-red-700 rounded-2xl py-5 text-center font-bold text-white shadow-lg shadow-red-700/20"
							style={{
								transform: frame > 100 && frame < 110 ? 'scale(0.95)' : 'scale(1)',
								backgroundColor: frame > 100 ? '#991b1b' : '#b91c1c'
							}}
						>
							Log in
						</div>
					</div>
				</div>
			)}

			{/* Chat Screen */}
			{frame >= 115 && (
				<div style={{ opacity: chatOpacity }} className="h-full flex flex-col bg-black pt-12">
					{/* Header */}
					<div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center text-white font-bold">F</div>
							<span className="text-xl font-bold text-white">Food Assistant</span>
						</div>
						<div className="w-10 h-10 bg-[#111] rounded-full flex items-center justify-center">
							<User size={20} className="text-slate-400" />
						</div>
					</div>

					{/* Chat Content */}
					<div className="flex-1 overflow-hidden relative">
						<div className="absolute inset-0 px-6 py-8 space-y-8">
							{/* Budget Response */}
							{frame > 320 && (
								<div className="space-y-6">
									<div className="flex justify-end">
										<div className="bg-red-700/20 text-red-100 px-6 py-4 rounded-3xl rounded-tr-none max-w-[80%]">
											{budgetText}
										</div>
									</div>
									<div className="flex gap-4">
										<div className="w-10 h-10 bg-red-700 rounded-xl flex-shrink-0 flex items-center justify-center">
											<Bot size={24} className="text-white" />
										</div>
										<div className="bg-[#111] border border-white/5 p-6 rounded-3xl rounded-tl-none space-y-4 w-full">
											<p className="text-slate-200">I found some great options for you!</p>
											<div className="bg-black/40 rounded-2xl overflow-hidden border border-white/5">
												<div className="h-40 bg-slate-800 animate-pulse" />
												<div className="p-4">
													<h3 className="text-white font-bold text-lg">Zinger Burger</h3>
													<div className="flex justify-between items-center mt-2">
														<span className="text-red-500 font-bold">PKR 450</span>
														<div className="flex items-center gap-1 text-yellow-500">
															<Star size={16} fill="currentColor" />
															<span className="text-sm">4.5</span>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Quality Response */}
							{frame > 680 && (
								<div className="space-y-6">
									<div className="flex justify-end">
										<div className="bg-red-700/20 text-red-100 px-6 py-4 rounded-3xl rounded-tr-none max-w-[80%]">
											{qualityText}
										</div>
									</div>
									<div className="flex gap-4">
										<div className="w-10 h-10 bg-red-700 rounded-xl flex-shrink-0 flex items-center justify-center">
											<Bot size={24} className="text-white" />
										</div>
										<div className="bg-[#111] border border-white/5 p-6 rounded-3xl rounded-tl-none space-y-4 w-full">
											<p className="text-slate-200">The highest rated pizzas in your area:</p>
											<div className="bg-black/40 rounded-2xl overflow-hidden border border-white/5">
												<div className="h-40 bg-slate-800 animate-pulse" />
												<div className="p-4">
													<h3 className="text-white font-bold text-lg">Premium Italian Pizza</h3>
													<div className="flex justify-between items-center mt-2">
														<span className="text-red-500 font-bold">PKR 1,200</span>
														<div className="flex items-center gap-1 text-yellow-500">
															<Star size={16} fill="currentColor" />
															<span className="text-sm">4.9</span>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Prompt Response */}
							{frame > 1040 && (
								<div className="space-y-6">
									<div className="flex justify-end">
										<div className="bg-red-700/20 text-red-100 px-6 py-4 rounded-3xl rounded-tr-none max-w-[80%]">
											{promptText}
										</div>
									</div>
									<div className="flex gap-4">
										<div className="w-10 h-10 bg-red-700 rounded-xl flex-shrink-0 flex items-center justify-center">
											<Bot size={24} className="text-white" />
										</div>
										<div className="bg-[#111] border border-white/5 p-6 rounded-3xl rounded-tl-none space-y-4 w-full">
											<p className="text-slate-200">Zaiqa Chai is available at these spots:</p>
											<div className="bg-black/40 rounded-2xl overflow-hidden border border-white/5">
												<div className="h-40 bg-slate-800 animate-pulse" />
												<div className="p-4">
													<h3 className="text-white font-bold text-lg">Chai Shai Corner</h3>
													<div className="flex justify-between items-center mt-2">
														<span className="text-red-500 font-bold">PKR 150</span>
														<div className="flex items-center gap-1 text-yellow-500">
															<Star size={16} fill="currentColor" />
															<span className="text-sm">4.7</span>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Scroll simulation */}
						<div
							className="absolute inset-0 bg-transparent"
							style={{
								transform: `translateY(-${interpolate(frame, [350, 420, 720, 780, 1080, 1140], [0, 200, 200, 400, 400, 600], { extrapolateRight: 'clamp' })}px)`
							}}
						/>
					</div>

					{/* Controls Overlay */}
					<div className="bg-[#0a0a0a] border-t border-white/5 p-6 space-y-6">
						{/* Mode Switcher */}
						<div className="flex bg-[#111] rounded-2xl p-1.5 gap-1">
							{[
								{ id: 'budget', icon: Wallet, label: 'Budget' },
								{ id: 'quality', icon: Star, label: 'Quality' },
								{ id: 'prompt', icon: MessageSquare, label: 'Prompt' },
							].map((m) => (
								<div
									key={m.id}
									className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
										activeMode === m.id ? 'bg-red-700 text-white shadow-lg' : 'text-slate-500'
									}`}
								>
									<m.icon size={18} />
									<span className="text-sm font-medium">{m.label}</span>
								</div>
							))}
						</div>

						{/* Input Box */}
						<div className="relative group">
							<div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
								<Search size={22} />
							</div>
							<div className="w-full bg-[#111] border border-white/10 rounded-3xl py-5 pl-14 pr-14 text-white">
								{activeMode === 'budget' && currentBudgetText}
								{activeMode === 'quality' && currentQualityText}
								{activeMode === 'prompt' && currentPromptText}
								<span className="animate-pulse ml-1 border-r-2 border-red-500 h-6" />
							</div>
							<div
								className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-red-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-700/20"
								style={{
									transform: (frame > 280 && frame < 300) || (frame > 640 && frame < 660) || (frame > 1000 && frame < 1020) ? 'scale(0.9)' : 'scale(1)',
									opacity: (activeMode === 'budget' && currentBudgetText.length > 0) || (activeMode === 'quality' && currentQualityText.length > 0) || (activeMode === 'prompt' && currentPromptText.length > 0) ? 1 : 0.5
								}}
							>
								<ChevronRight size={24} />
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Caption Overlay */}
			<div className="absolute top-32 left-0 right-0 px-10 z-[60]">
				<div
					className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-center shadow-2xl"
					style={{
						opacity: interpolate(frame, [150, 180, 1100, 1140], [0, 1, 1, 0]),
						transform: `translateY(${spring({ frame: frame - 150, fps, from: 50, to: 0 })}px)`
					}}
				>
					<h2 className="text-2xl font-bold text-white mb-2">
						{activeMode === 'budget' && "Find the best deals! 💸"}
						{activeMode === 'quality' && "Only the best quality! ⭐"}
						{activeMode === 'prompt' && "Ask anything! 🤖"}
					</h2>
				</div>
			</div>
		</PhoneFrame>
	);
};
