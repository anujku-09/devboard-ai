interface ProgressBarProps {
    value: number;
}

function ProgressBar({
    value,
}: ProgressBarProps) {
    return (
        <div className="w-full h-1.5 sm:h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
                className="h-full bg-ember rounded-full transition-all duration-700 ease-out"
                style={{
                    width: `${value}%`,
                }}
            />
        </div>
    );
}
export default ProgressBar;