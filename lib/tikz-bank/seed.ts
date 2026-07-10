import "server-only";

type Seed = {
  title: string;
  description: string;
  category: string;
  subject: string;
  grade: string | null;
  tags: string[];
  tikz_code: string;
};

const seed = (title: string, description: string, category: string, subject: string, grade: string | null, tags: string[], tikz_code: string): Seed => ({ title, description, category, subject, grade, tags, tikz_code });

export function getTikzBankSeeds(): Seed[] {
  return [
    seed("Trục tọa độ Oxy cơ bản", "Hệ trục có lưới, nhãn O, x, y.", "Trục tọa độ", "Toán", null, ["Oxy", "trục tọa độ"], String.raw`\begin{tikzpicture}[scale=0.8]
\draw[step=1cm,gray!20,very thin] (-3,-3) grid (3,3);
\draw[->] (-3.3,0)--(3.4,0) node[right] {$x$};
\draw[->] (0,-3.3)--(0,3.4) node[above] {$y$};
\node[below left] at (0,0) {$O$};
\end{tikzpicture}`),
    seed("Đồ thị hàm số bậc nhất", "Đường thẳng y = x + 1 trên hệ trục Oxy.", "Đồ thị hàm số", "Toán", "9", ["hàm bậc nhất", "đường thẳng"], String.raw`\begin{tikzpicture}[scale=0.8]
\draw[->] (-3,0)--(3.5,0) node[right] {$x$};
\draw[->] (0,-2)--(0,4) node[above] {$y$};
\draw[blue,thick,domain=-2.5:2.5] plot (\x,{\x+1});
\node[blue] at (2.2,3.6) {$y=x+1$};
\end{tikzpicture}`),
    seed("Parabol y = x bình phương", "Parabol cơ bản có đỉnh tại O.", "Đồ thị hàm số", "Toán", "9", ["parabol", "hàm bậc hai"], String.raw`\begin{tikzpicture}[scale=0.8]
\draw[->] (-3,0)--(3,0) node[right] {$x$};
\draw[->] (0,-1)--(0,5) node[above] {$y$};
\draw[blue,thick,domain=-2.2:2.2,samples=60] plot (\x,{\x*\x});
\node[blue] at (2,4.5) {$y=x^2$};
\end{tikzpicture}`),
    seed("Tam giác ABC", "Tam giác đơn giản có nhãn ba đỉnh.", "Tam giác", "Toán", "7", ["tam giác", "ABC"], String.raw`\begin{tikzpicture}[scale=1]
\coordinate (A) at (0,3); \coordinate (B) at (-2,0); \coordinate (C) at (2,0);
\draw[thick] (A)--(B)--(C)--cycle;
\node[above] at (A) {$A$}; \node[below left] at (B) {$B$}; \node[below right] at (C) {$C$};
\end{tikzpicture}`),
    seed("Tam giác vuông ABC", "Tam giác vuông tại A với ký hiệu góc vuông.", "Tam giác", "Toán", "7", ["tam giác vuông", "góc vuông"], String.raw`\begin{tikzpicture}[scale=1]
\coordinate (A) at (0,0); \coordinate (B) at (4,0); \coordinate (C) at (0,3);
\draw[thick] (A)--(B)--(C)--cycle;
\draw (0.35,0)--(0.35,0.35)--(0,0.35);
\node[below left] at (A) {$A$}; \node[below] at (B) {$B$}; \node[left] at (C) {$C$};
\end{tikzpicture}`),
    seed("Đường tròn tâm O bán kính R", "Đường tròn có tâm và một bán kính được ghi nhãn.", "Đường tròn", "Toán", "9", ["đường tròn", "bán kính"], String.raw`\begin{tikzpicture}
\coordinate (O) at (0,0); \coordinate (A) at (2.5,0);
\draw[thick] (O) circle (2.5cm); \draw[thick] (O)--(A) node[midway,above] {$R$};
\fill (O) circle (1.5pt) node[below left] {$O$}; \fill (A) circle (1.5pt) node[right] {$A$};
\end{tikzpicture}`),
    seed("Dây cung và tiếp tuyến", "Đường tròn với dây AB và tiếp tuyến tại A.", "Đường tròn", "Toán", "9", ["dây cung", "tiếp tuyến"], String.raw`\begin{tikzpicture}
\coordinate (O) at (0,0); \coordinate (A) at (2.4,0); \coordinate (B) at (-1.2,2.08);
\draw[thick] (O) circle (2.4cm); \draw (A)--(B); \draw[blue,thick] (2.4,-2)--(2.4,2);
\draw (O)--(A); \node[right] at (A) {$A$}; \node[above left] at (B) {$B$}; \node[below] at (O) {$O$};
\end{tikzpicture}`),
    seed("Hình bình hành ABCD", "Hình bình hành với bốn đỉnh được đánh dấu.", "Tứ giác", "Toán", "8", ["hình bình hành", "tứ giác"], String.raw`\begin{tikzpicture}
\coordinate (A) at (0,0); \coordinate (B) at (3,0); \coordinate (C) at (4,2); \coordinate (D) at (1,2);
\draw[thick] (A)--(B)--(C)--(D)--cycle;
\node[below] at (A) {$A$}; \node[below] at (B) {$B$}; \node[above] at (C) {$C$}; \node[above] at (D) {$D$};
\end{tikzpicture}`),
    seed("Hình thang ABCD", "Hình thang có hai đáy song song.", "Tứ giác", "Toán", "8", ["hình thang", "song song"], String.raw`\begin{tikzpicture}
\coordinate (A) at (0,0); \coordinate (B) at (4,0); \coordinate (C) at (3,2); \coordinate (D) at (1,2);
\draw[thick] (A)--(B)--(C)--(D)--cycle;
\node[below] at (A) {$A$}; \node[below] at (B) {$B$}; \node[above] at (C) {$C$}; \node[above] at (D) {$D$};
\end{tikzpicture}`),
    seed("Hình chữ nhật ABCD", "Hình chữ nhật cơ bản.", "Tứ giác", "Toán", "8", ["hình chữ nhật"], String.raw`\begin{tikzpicture}
\draw[thick] (0,0) rectangle (4,2.5);
\node[below left] at (0,0) {$A$}; \node[below right] at (4,0) {$B$};
\node[above right] at (4,2.5) {$C$}; \node[above left] at (0,2.5) {$D$};
\end{tikzpicture}`),
    seed("Hình vuông ABCD", "Hình vuông cạnh bằng nhau.", "Tứ giác", "Toán", "8", ["hình vuông"], String.raw`\begin{tikzpicture}
\draw[thick] (0,0) rectangle (3,3);
\node[below left] at (0,0) {$A$}; \node[below right] at (3,0) {$B$};
\node[above right] at (3,3) {$C$}; \node[above left] at (0,3) {$D$};
\end{tikzpicture}`),
    seed("Vectơ AB", "Đoạn có mũi tên từ A tới B.", "Vectơ", "Toán", "10", ["vectơ", "AB"], String.raw`\begin{tikzpicture}
\coordinate (A) at (0,0); \coordinate (B) at (4,1.5);
\draw[->,very thick,blue] (A)--(B);
\fill (A) circle (1.5pt) node[below] {$A$}; \fill (B) circle (1.5pt) node[above] {$B$};
\end{tikzpicture}`),
    seed("Góc xOy", "Hai tia tạo góc và cung đánh dấu.", "Hình học phẳng", "Toán", "6", ["góc", "tia"], String.raw`\begin{tikzpicture}
\coordinate (O) at (0,0); \draw[->,thick] (O)--(4,0) node[right] {$x$};
\draw[->,thick] (O)--(2.8,2.8) node[above] {$y$};
\draw (0.8,0) arc (0:45:0.8); \node at (1.1,0.45) {$\alpha$}; \node[below left] at (O) {$O$};
\end{tikzpicture}`),
    seed("Đường cao AH trong tam giác", "Tam giác ABC có AH vuông góc BC.", "Tam giác", "Toán", "7", ["đường cao", "vuông góc"], String.raw`\begin{tikzpicture}
\coordinate (A) at (1,3); \coordinate (B) at (-2,0); \coordinate (C) at (3,0); \coordinate (H) at (1,0);
\draw[thick] (A)--(B)--(C)--cycle; \draw[dashed] (A)--(H);
\draw (1,0.3)--(1.3,0.3)--(1.3,0); \node[above] at (A) {$A$}; \node[below] at (B) {$B$}; \node[below] at (C) {$C$}; \node[below] at (H) {$H$};
\end{tikzpicture}`),
    seed("Trung tuyến AM trong tam giác", "Tam giác ABC với M là trung điểm của BC.", "Tam giác", "Toán", "7", ["trung tuyến", "trung điểm"], String.raw`\begin{tikzpicture}
\coordinate (A) at (0,3); \coordinate (B) at (-2,0); \coordinate (C) at (2,0); \coordinate (M) at (0,0);
\draw[thick] (A)--(B)--(C)--cycle; \draw[blue] (A)--(M);
\node[above] at (A) {$A$}; \node[below] at (B) {$B$}; \node[below] at (C) {$C$}; \node[below] at (M) {$M$};
\end{tikzpicture}`),
    seed("Điểm A trên hệ trục Oxy", "Hệ trục có điểm A(a,b) và đường chiếu nét đứt.", "Trục tọa độ", "Toán", "10", ["tọa độ điểm", "đường chiếu"], String.raw`\begin{tikzpicture}[scale=0.8]
\draw[->] (-1,0)--(5,0) node[right] {$x$}; \draw[->] (0,-1)--(0,4) node[above] {$y$};
\coordinate (A) at (3,2); \draw[dashed] (3,0)--(A)--(0,2); \fill[blue] (A) circle (2pt) node[above right] {$A(a,b)$};
\node[below left] at (0,0) {$O$};
\end{tikzpicture}`),
    seed("Đồ thị sin đơn giản", "Một chu kỳ của đồ thị y = sin x.", "Đồ thị hàm số", "Toán", "11", ["sin", "lượng giác"], String.raw`\begin{tikzpicture}[xscale=0.9,yscale=1.2]
\draw[->] (-0.5,0)--(7,0) node[right] {$x$}; \draw[->] (0,-1.5)--(0,1.6) node[above] {$y$};
\draw[blue,thick,domain=0:6.28,samples=80] plot (\x,{sin(\x r)});
\node[blue] at (5.5,1.2) {$y=\sin x$};
\end{tikzpicture}`),
    seed("Mạch điện pin điện trở công tắc", "Sơ đồ mạch kín đơn giản bằng các nét TikZ cơ bản.", "Vật lí", "Vật lí", "9", ["mạch điện", "điện trở", "công tắc"], String.raw`\begin{tikzpicture}
\draw[thick] (0,0)--(1,0); \draw[thick] (1,-0.5)--(1,0.5); \draw[thick] (1.3,-0.3)--(1.3,0.3);
\draw[thick] (1.3,0)--(2.5,0)--(2.9,0.35); \fill (2.5,0) circle (1.5pt); \fill (3.2,0) circle (1.5pt);
\draw[thick] (3.2,0)--(4,0)--(4.3,0.35)--(4.6,-0.35)--(4.9,0.35)--(5.2,-0.35)--(5.5,0)--(6,0)--(6,-2)--(0,-2)--cycle;
\node[above] at (4.8,0.5) {Điện trở};
\end{tikzpicture}`),
    seed("Thấu kính hội tụ", "Trục chính, thấu kính và hai tiêu điểm.", "Vật lí", "Vật lí", "9", ["thấu kính", "quang học"], String.raw`\begin{tikzpicture}
\draw[->] (-4,0)--(4,0) node[right] {Trục chính};
\draw[thick] (0,-2)--(0,2); \draw[->] (0,1.4)--(0,2); \draw[->] (0,-1.4)--(0,-2);
\fill (-2,0) circle (1.5pt) node[below] {$F$}; \fill (2,0) circle (1.5pt) node[below] {$F'$};
\node[above right] at (0,0) {$O$};
\end{tikzpicture}`),
    seed("Tia tới và tia phản xạ", "Gương phẳng, pháp tuyến và hai tia sáng.", "Vật lí", "Vật lí", "7", ["phản xạ", "gương phẳng"], String.raw`\begin{tikzpicture}
\draw[thick] (-3,0)--(3,0) node[right] {Gương}; \draw[dashed] (0,-0.5)--(0,3) node[above] {Pháp tuyến};
\draw[->,blue,thick] (-2,2)--(0,0); \draw[->,red,thick] (0,0)--(2,2);
\node[left] at (-1.3,1.4) {Tia tới}; \node[right] at (1.2,1.4) {Tia phản xạ};
\end{tikzpicture}`),
    seed("Hình chóp tứ giác S.ABCD", "Hình chóp có cạnh khuất nét đứt.", "Hình học không gian", "Toán", "11", ["hình chóp", "nét đứt"], String.raw`\begin{tikzpicture}
\coordinate (A) at (0,0); \coordinate (B) at (3,0); \coordinate (C) at (4,1.3); \coordinate (D) at (1,1.3); \coordinate (S) at (2,4);
\draw[thick] (A)--(B)--(C); \draw[dashed] (C)--(D)--(A); \draw[thick] (S)--(A) (S)--(B) (S)--(C); \draw[dashed] (S)--(D);
\node[above] at (S) {$S$}; \node[below] at (A) {$A$}; \node[below] at (B) {$B$}; \node[right] at (C) {$C$}; \node[left] at (D) {$D$};
\end{tikzpicture}`),
    seed("Hình lập phương nét đứt", "Khối lập phương có các cạnh khuất.", "Hình học không gian", "Toán", "11", ["lập phương", "khối hộp"], String.raw`\begin{tikzpicture}
\draw[thick] (0,0) rectangle (3,3); \draw[thick] (0,3)--(1,4)--(4,4)--(3,3); \draw[thick] (3,0)--(4,1)--(4,4);
\draw[dashed] (0,0)--(1,1)--(4,1); \draw[dashed] (1,1)--(1,4);
\end{tikzpicture}`),
    seed("Lăng trụ tam giác", "Lăng trụ ABC.A'B'C' đơn giản.", "Hình học không gian", "Toán", "11", ["lăng trụ", "tam giác"], String.raw`\begin{tikzpicture}
\coordinate (A) at (0,0); \coordinate (B) at (2,0); \coordinate (C) at (0.8,2); \coordinate (Ap) at (2,1); \coordinate (Bp) at (4,1); \coordinate (Cp) at (2.8,3);
\draw[thick] (A)--(B)--(C)--cycle; \draw[thick] (Ap)--(Bp)--(Cp)--cycle; \draw[thick] (A)--(Ap) (B)--(Bp) (C)--(Cp);
\end{tikzpicture}`),
    seed("Hình trụ đơn giản", "Hình trụ với hai đáy elip.", "Hình học không gian", "Toán", "12", ["hình trụ", "khối tròn xoay"], String.raw`\begin{tikzpicture}
\draw[thick] (-2,0) arc (180:360:2 and 0.6); \draw[dashed] (2,0) arc (0:180:2 and 0.6);
\draw[thick] (-2,0)--(-2,4) (2,0)--(2,4); \draw[thick] (0,4) ellipse (2 and 0.6);
\end{tikzpicture}`),
    seed("Hình nón đơn giản", "Hình nón với đường cao và đáy elip.", "Hình học không gian", "Toán", "12", ["hình nón", "khối tròn xoay"], String.raw`\begin{tikzpicture}
\coordinate (S) at (0,4); \draw[thick] (S)--(-2,0) (S)--(2,0);
\draw[thick] (-2,0) arc (180:360:2 and 0.6); \draw[dashed] (2,0) arc (0:180:2 and 0.6);
\draw[dashed] (S)--(0,0); \node[above] at (S) {$S$}; \node[below] at (0,0) {$O$};
\end{tikzpicture}`),
  ];
}
