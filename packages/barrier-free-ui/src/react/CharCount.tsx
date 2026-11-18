
export function CharCount({ id, count, max, label }: {
  id?: string;
  count: number;
  max: number;
  /** 何の字数か（複数の欄の合計のとき。例: 「6 欄の合計」） */
  label?: string;
}) {
  const over = count > max;
  return (
    <p id={id} className="bf-char-count" data-over={over || undefined}>
      {label ? `${label} ` : ""}
      {count} / {max}字
      {}
      <span role="status">{over ? `（${count - max}字多い）` : ""}</span>
    </p>
  );
}
