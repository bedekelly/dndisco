import { useCallback, useEffect, useRef, useState } from "react";

const MAX_LENGTH = 30;

type ControlledComponent<T> = {
  value: T;
  setValue: (newValue: T) => void;
};

function useCopyState<T>(value: T) {
  const [innerValue, setInnerValue] = useState(value);
  useEffect(() => {
    setInnerValue(value);
  }, [value]);
  return [innerValue, setInnerValue] as const;
}

export default function ClickableInput({
  value,
  setValue,
}: ControlledComponent<string>) {
  const [innerValue, setInnerValue] = useCopyState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);

  const onBlur = useCallback(() => {
    if (innerValue) setValue(innerValue);
    else setInnerValue(value);
    setActive(false);
  }, [innerValue, setInnerValue, setValue, value]);

  const onChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      if (newValue.length <= MAX_LENGTH) setInnerValue(e.target.value);
    },
    [setInnerValue]
  );

  if (!active)
    return (
      <button
        onClick={() => {
          setActive(true);
          setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(0, innerValue.length);
          }, 0);
        }}
      >
        {value}
      </button>
    );
  else
    return (
      <input
        type="text"
        className="bg-transparent w-full block"
        ref={inputRef}
        value={innerValue}
        onChange={onChange}
        onBlur={onBlur}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            onBlur();
          }
        }}
      />
    );
}
