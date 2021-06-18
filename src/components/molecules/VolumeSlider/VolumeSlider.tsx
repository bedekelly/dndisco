type VolumeSliderProps = {
  value: number;
  setValue: (newValue: number) => void;
};

export default function VolumeSlider({ value, setValue }: VolumeSliderProps) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={value * 100}
      onChange={(e) => setValue(parseInt(e.target.value) / 100)}
    />
  );
}
