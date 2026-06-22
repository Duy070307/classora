import type { QuestionDifficulty } from "@/lib/types";

export type MultipleChoiceTemplate = {
  topic: string;
  stem: string;
  options: [string, string, string, string];
  answer: "A" | "B" | "C" | "D";
  explanation: string;
};

export type TrueFalseTemplate = {
  topic: string;
  context: string;
  items: [string, string, string, string];
  answers: [boolean, boolean, boolean, boolean];
  explanation: string;
};

export type ShortAnswerTemplate = {
  topic: string;
  stem: string;
  answer: string;
  scoringNote: string;
};

export type SubjectPack = {
  key: string;
  topics: string[];
  actions: Record<QuestionDifficulty, string>;
  multipleChoice: MultipleChoiceTemplate[];
  trueFalse: TrueFalseTemplate[];
  shortAnswer: ShortAnswerTemplate[];
};

const commonActions: Record<QuestionDifficulty, string> = {
  "Nhận biết": "Nhận diện kiến thức, thuật ngữ hoặc dữ kiện cốt lõi",
  "Thông hiểu": "Giải thích, so sánh và xác định mối liên hệ",
  "Vận dụng": "Áp dụng kiến thức để xử lí tình huống quen thuộc",
  "Vận dụng cao": "Kết nối nhiều dữ kiện để giải quyết tình huống tổng hợp",
};

const packs: SubjectPack[] = [
  {
    key: "toán",
    topics: ["Hàm số", "Đạo hàm", "Nguyên hàm và tích phân", "Mũ và logarit", "Hình học không gian", "Xác suất và thống kê", "Tọa độ Oxyz", "Bài toán thực tế"],
    actions: commonActions,
    multipleChoice: [
      { topic: "Hàm số", stem: "Hàm số y = x³ - 3x đồng biến trên khoảng nào?", options: ["(-1; 1)", "(-∞; -1) và (1; +∞)", "(-∞; 1)", "(-1; +∞)"], answer: "B", explanation: "y' = 3x² - 3 > 0 khi x < -1 hoặc x > 1." },
      { topic: "Đạo hàm", stem: "Đạo hàm của hàm số y = e^(2x) là", options: ["e^(2x)", "2e^x", "2e^(2x)", "e^(x²)"], answer: "C", explanation: "Dùng công thức (e^u)' = u'e^u với u = 2x." },
      { topic: "Nguyên hàm và tích phân", stem: "Giá trị của tích phân từ 0 đến 1 của hàm số 2x là", options: ["1", "2", "1/2", "0"], answer: "A", explanation: "Nguyên hàm của 2x là x²; thay cận được 1." },
      { topic: "Mũ và logarit", stem: "Nghiệm của phương trình log₂x = 3 là", options: ["x = 6", "x = 9", "x = 1/8", "x = 8"], answer: "D", explanation: "log₂x = 3 tương đương x = 2³ = 8." },
      { topic: "Hình học không gian", stem: "Thể tích khối chóp có diện tích đáy B và chiều cao h bằng", options: ["Bh", "Bh/3", "3Bh", "Bh/2"], answer: "B", explanation: "Công thức thể tích khối chóp là V = Bh/3." },
      { topic: "Xác suất và thống kê", stem: "Gieo một đồng xu cân đối hai lần. Xác suất xuất hiện đúng một mặt ngửa là", options: ["1/4", "1/3", "3/4", "1/2"], answer: "D", explanation: "Có 2 kết quả thuận lợi trong 4 kết quả đồng khả năng." },
      { topic: "Tọa độ Oxyz", stem: "Trong không gian Oxyz, khoảng cách từ A(1; 2; 2) đến gốc tọa độ bằng", options: ["3", "5", "√5", "9"], answer: "A", explanation: "OA = √(1² + 2² + 2²) = 3." },
      { topic: "Bài toán thực tế", stem: "Một sản phẩm giá 500.000 đồng được giảm 20%. Giá sau giảm là", options: ["300.000 đồng", "450.000 đồng", "400.000 đồng", "480.000 đồng"], answer: "C", explanation: "Giá sau giảm bằng 500.000 × 80% = 400.000 đồng." },
    ],
    trueFalse: [
      { topic: "Đạo hàm và hàm số", context: "Cho hàm số f(x) = x² - 2x.", items: ["f'(x) = 2x - 2.", "Hàm số đồng biến trên (-∞; 1).", "Giá trị nhỏ nhất của hàm số là -1.", "Đồ thị đi qua điểm (0; 1)."], answers: [true, false, true, false], explanation: "Đạo hàm đổi dấu tại x = 1; f(1) = -1 và f(0) = 0." },
      { topic: "Xác suất", context: "Một hộp có 3 viên bi đỏ và 2 viên bi xanh, lấy ngẫu nhiên một viên.", items: ["Có 5 kết quả đồng khả năng nếu phân biệt từng viên.", "Xác suất lấy được bi đỏ là 2/5.", "Xác suất lấy được bi xanh là 2/5.", "Biến cố lấy được bi đỏ và bi xanh cùng lúc là không thể."], answers: [true, false, true, true], explanation: "Có 3 bi đỏ và 2 bi xanh; mỗi lần chỉ lấy một viên." },
    ],
    shortAnswer: [
      { topic: "Mũ và logarit", stem: "Giải phương trình 3^x = 27.", answer: "x = 3", scoringNote: "Xác định 27 = 3³ và kết luận đúng x = 3." },
      { topic: "Tọa độ Oxyz", stem: "Tính độ dài đoạn thẳng AB với A(1; 0; 0), B(1; 3; 4).", answer: "AB = 5", scoringNote: "Lập đúng công thức khoảng cách và tính √(3² + 4²) = 5." },
      { topic: "Bài toán thực tế", stem: "Một khoản tiền 10 triệu đồng tăng 5% sau một năm. Tính số tiền cuối năm.", answer: "10,5 triệu đồng", scoringNote: "Tính đúng 10 × 1,05; chấp nhận 10.500.000 đồng." },
    ],
  },
  {
    key: "lịch sử",
    topics: ["Việt Nam 1919-1930", "Phong trào 1930-1945", "Kháng chiến 1945-1954", "Cách mạng 1954-1975", "Đổi mới từ 1986"],
    actions: commonActions,
    multipleChoice: [
      { topic: "Việt Nam 1919-1930", stem: "Sự kiện đánh dấu sự ra đời của một chính đảng thống nhất lãnh đạo cách mạng Việt Nam là", options: ["Thành lập Hội Việt Nam Cách mạng Thanh niên", "Thành lập Đông Dương Cộng sản đảng", "Hội nghị thành lập Đảng Cộng sản Việt Nam", "Phong trào công nhân Ba Son"], answer: "C", explanation: "Hội nghị đầu năm 1930 hợp nhất các tổ chức cộng sản, thành lập Đảng Cộng sản Việt Nam." },
      { topic: "Phong trào 1930-1945", stem: "Ý nghĩa nổi bật của Cách mạng tháng Tám năm 1945 là", options: ["Mở ra kỉ nguyên độc lập, tự do cho dân tộc", "Hoàn thành thống nhất đất nước", "Chấm dứt hoàn toàn chiến tranh ở Đông Dương", "Mở đầu công cuộc Đổi mới"], answer: "A", explanation: "Cách mạng tháng Tám lật đổ ách thống trị cũ và thành lập nước Việt Nam Dân chủ Cộng hòa." },
      { topic: "Kháng chiến 1945-1954", stem: "Chiến thắng nào buộc Pháp phải kí Hiệp định Genève năm 1954?", options: ["Việt Bắc thu - đông 1947", "Biên giới thu - đông 1950", "Điện Biên Phủ 1954", "Hòa Bình 1951-1952"], answer: "C", explanation: "Chiến thắng Điện Biên Phủ tạo bước ngoặt quyết định, buộc Pháp kí Hiệp định Genève." },
      { topic: "Cách mạng 1954-1975", stem: "Thắng lợi nào hoàn thành sự nghiệp giải phóng miền Nam, thống nhất đất nước?", options: ["Phong trào Đồng khởi", "Chiến dịch Hồ Chí Minh", "Chiến thắng Vạn Tường", "Hiệp định Paris"], answer: "B", explanation: "Chiến dịch Hồ Chí Minh kết thúc thắng lợi ngày 30/4/1975." },
      { topic: "Đổi mới từ 1986", stem: "Đường lối Đổi mới được đề ra tại Đại hội đại biểu toàn quốc lần thứ", options: ["IV", "V", "VII", "VI"], answer: "D", explanation: "Đại hội VI của Đảng (12/1986) đề ra đường lối Đổi mới." },
    ],
    trueFalse: [
      { topic: "Kháng chiến 1945-1954", context: "Đọc thông tin về cuộc kháng chiến chống thực dân Pháp của nhân dân Việt Nam.", items: ["Đường lối kháng chiến mang tính toàn dân, toàn diện.", "Chiến dịch Biên giới năm 1950 làm Pháp kết thúc chiến tranh ngay lập tức.", "Điện Biên Phủ là thắng lợi quân sự có ý nghĩa quyết định.", "Hiệp định Genève công nhận các quyền dân tộc cơ bản của Việt Nam."], answers: [true, false, true, true], explanation: "Chiến dịch Biên giới tạo thế chủ động nhưng chiến tranh chỉ kết thúc sau Điện Biên Phủ và Hiệp định Genève." },
      { topic: "Đổi mới từ 1986", context: "Xét những nội dung cơ bản của công cuộc Đổi mới ở Việt Nam.", items: ["Đổi mới được khởi xướng từ Đại hội VI.", "Đổi mới chỉ giới hạn trong lĩnh vực văn hóa.", "Đổi mới kinh tế gắn với mở rộng quan hệ đối ngoại.", "Đổi mới không đồng nghĩa với từ bỏ mục tiêu xã hội chủ nghĩa."], answers: [true, false, true, true], explanation: "Đổi mới là toàn diện, trọng tâm trước hết là kinh tế và vẫn giữ mục tiêu phát triển đã lựa chọn." },
    ],
    shortAnswer: [
      { topic: "Việt Nam 1919-1930", stem: "Nêu ý nghĩa của việc thành lập Đảng Cộng sản Việt Nam năm 1930.", answer: "Chấm dứt khủng hoảng về đường lối và tổ chức lãnh đạo; tạo bước ngoặt của cách mạng Việt Nam.", scoringNote: "Đủ hai ý: giải quyết khủng hoảng lãnh đạo và mở ra bước ngoặt cách mạng." },
      { topic: "Cách mạng 1954-1975", stem: "Nêu kết quả trực tiếp của Chiến dịch Hồ Chí Minh năm 1975.", answer: "Giải phóng Sài Gòn, kết thúc chiến tranh, hoàn thành giải phóng miền Nam.", scoringNote: "Chấp nhận diễn đạt tương đương, cần nêu được giải phóng miền Nam và kết thúc chiến tranh." },
    ],
  },
  {
    key: "tiếng anh",
    topics: ["Grammar", "Vocabulary", "Pronunciation and stress", "Sentence transformation", "Reading comprehension", "Cloze test"],
    actions: commonActions,
    multipleChoice: [
      { topic: "Grammar", stem: "If Lan studied harder, she ___ better results.", options: ["gets", "would get", "will get", "got"], answer: "B", explanation: "This is the second conditional: If + past simple, would + verb." },
      { topic: "Vocabulary", stem: "The word “essential” is closest in meaning to ___.", options: ["necessary", "optional", "expensive", "unusual"], answer: "A", explanation: "Essential means necessary or very important." },
      { topic: "Grammar", stem: "The school library ___ last year.", options: ["renovates", "has renovated", "was renovated", "is renovating"], answer: "C", explanation: "The passive past simple is needed because the action happened last year." },
      { topic: "Communication", stem: "Mai: “Thank you for helping me.” — Nam: “___”", options: ["Never mind the question.", "That is wrong.", "I do not know.", "You’re welcome."], answer: "D", explanation: "“You’re welcome” is a natural response to thanks." },
      { topic: "Reading comprehension", stem: "A student reads for twenty minutes every evening because it helps her relax and learn new words. Why does she read daily?", options: ["To avoid homework", "To relax and improve vocabulary", "To meet her friends", "To watch fewer films"], answer: "B", explanation: "The sentence gives both reasons directly." },
    ],
    trueFalse: [
      { topic: "Reading comprehension", context: "Read the text: Minh cycles to school three days a week. He says cycling saves money and helps him stay healthy.", items: ["Minh cycles to school every day.", "He believes cycling is economical.", "Cycling helps him keep fit.", "The text says his school is very far away."], answers: [false, true, true, false], explanation: "The text mentions three days a week, saving money and staying healthy; it gives no distance." },
    ],
    shortAnswer: [
      { topic: "Sentence transformation", stem: "Rewrite without changing the meaning: “They built this bridge in 2020.”", answer: "This bridge was built in 2020.", scoringNote: "Use the correct passive form, retain the time expression and original meaning." },
      { topic: "Vocabulary", stem: "Give one natural English sentence using the word “responsible”.", answer: "Students should be responsible for completing their homework.", scoringNote: "Accept another grammatical sentence that uses “responsible” with the correct meaning." },
    ],
  },
  {
    key: "ngữ văn",
    topics: ["Đọc hiểu", "Biện pháp tu từ", "Chủ đề và thông điệp", "Nghị luận xã hội", "Nghị luận văn học"],
    actions: commonActions,
    multipleChoice: [
      { topic: "Đọc hiểu", stem: "Trong câu “Mỗi trang sách mở ra một ô cửa nhìn vào thế giới”, hình ảnh “ô cửa” chủ yếu gợi điều gì?", options: ["Không gian lớp học", "Khả năng mở rộng hiểu biết", "Một vật dụng quen thuộc", "Khoảng cách giữa con người"], answer: "B", explanation: "“Ô cửa” là hình ảnh ẩn dụ cho con đường khám phá tri thức và cuộc sống." },
      { topic: "Biện pháp tu từ", stem: "Câu “Tiếng mưa gõ nhịp trên mái lá” sử dụng biện pháp tu từ nổi bật nào?", options: ["So sánh", "Hoán dụ", "Nhân hóa", "Nói quá"], answer: "C", explanation: "Mưa được gán hành động “gõ nhịp” của con người." },
      { topic: "Chủ đề và thông điệp", stem: "Một văn bản kể về người học sinh kiên trì sửa từng lỗi nhỏ để tiến bộ thường hướng đến thông điệp nào?", options: ["Tiến bộ được tạo nên từ nỗ lực bền bỉ", "Thành công chỉ phụ thuộc may mắn", "Sai lầm luôn phải che giấu", "Học tập không cần mục tiêu"], answer: "A", explanation: "Chi tiết kiên trì sửa lỗi nhấn mạnh vai trò của nỗ lực đều đặn." },
      { topic: "Nghị luận xã hội", stem: "Dẫn chứng trong đoạn văn nghị luận xã hội cần đáp ứng yêu cầu nào?", options: ["Càng dài càng tốt", "Chỉ lấy từ tác phẩm văn học", "Không cần liên quan luận điểm", "Tiêu biểu, xác thực và phù hợp luận điểm"], answer: "D", explanation: "Dẫn chứng có nhiệm vụ làm sáng tỏ và tăng sức thuyết phục cho luận điểm." },
    ],
    trueFalse: [
      { topic: "Đọc hiểu", context: "Đọc đoạn văn tự tạo: “Buổi sớm, con đường làng còn ướt sương. An chậm lại để nhặt chiếc chai nhựa bên vệ cỏ, rồi mới tiếp tục đến trường.”", items: ["Đoạn văn có yếu tố miêu tả.", "Hành động của An thể hiện ý thức giữ gìn môi trường.", "Nhân vật An đang trở về từ trường.", "Chi tiết chiếc chai nhựa góp phần làm rõ chủ đề trách nhiệm."], answers: [true, true, false, true], explanation: "Đoạn văn miêu tả buổi sớm và cho thấy An đang đến trường, chủ động nhặt rác." },
    ],
    shortAnswer: [
      { topic: "Đọc hiểu", stem: "Từ đoạn văn về An nhặt chai nhựa, hãy nêu thông điệp chính trong một câu.", answer: "Mỗi người nên bắt đầu bảo vệ môi trường từ những hành động nhỏ, thiết thực.", scoringNote: "Nêu đúng thông điệp trách nhiệm với môi trường; diễn đạt rõ, không bắt buộc trùng câu mẫu." },
      { topic: "Nghị luận xã hội", stem: "Viết ý chính cho đoạn văn khoảng 200 chữ bàn về giá trị của sự kiên trì.", answer: "Giải thích sự kiên trì; phân tích vai trò; nêu dẫn chứng phù hợp; rút ra bài học nhận thức và hành động.", scoringNote: "Chấm theo nội dung 70%, lập luận và dẫn chứng 20%, diễn đạt - chính tả 10%." },
      { topic: "Nghị luận văn học", stem: "Nêu hai tiêu chí cần có khi phân tích một hình tượng văn học.", answer: "Bám sát chi tiết nghệ thuật; làm rõ đặc điểm, ý nghĩa và thông điệp của hình tượng.", scoringNote: "Chấp nhận cách diễn đạt tương đương; ưu tiên câu trả lời có liên hệ giữa nội dung và nghệ thuật." },
    ],
  },
  {
    key: "vật lí",
    topics: ["Cơ học", "Điện học", "Dao động", "Quang học", "Năng lượng"],
    actions: commonActions,
    multipleChoice: [
      { topic: "Điện học", stem: "Một điện trở 10 Ω mắc vào hiệu điện thế 20 V. Cường độ dòng điện qua điện trở là", options: ["0,5 A", "2 A", "10 A", "200 A"], answer: "B", explanation: "Theo định luật Ohm: I = U/R = 20/10 = 2 A." },
      { topic: "Cơ học", stem: "Vật chuyển động đều với vận tốc 5 m/s trong 4 s. Quãng đường đi được là", options: ["20 m", "9 m", "1,25 m", "25 m"], answer: "A", explanation: "s = vt = 5 × 4 = 20 m." },
      { topic: "Năng lượng", stem: "Đơn vị của công trong hệ SI là", options: ["Watt", "Newton", "Joule", "Pascal"], answer: "C", explanation: "Công và năng lượng có đơn vị joule (J)." },
      { topic: "Quang học", stem: "Tia sáng truyền từ không khí vào nước thường", options: ["Không đổi hướng trong mọi trường hợp", "Bị phản xạ hoàn toàn", "Biến mất", "Bị khúc xạ tại mặt phân cách"], answer: "D", explanation: "Khi truyền qua hai môi trường trong suốt khác nhau, tia sáng thường bị khúc xạ." },
    ],
    trueFalse: [
      { topic: "Điện học", context: "Cho mạch điện có U = 12 V và R = 6 Ω.", items: ["Cường độ dòng điện là 2 A.", "Nếu R tăng gấp đôi và U không đổi thì I tăng gấp đôi.", "Công suất ban đầu là 24 W.", "Định luật Ohm có dạng U = IR."], answers: [true, false, true, true], explanation: "I = 2 A, P = UI = 24 W; khi R tăng thì I giảm." },
    ],
    shortAnswer: [
      { topic: "Cơ học", stem: "Một xe đi 150 m trong 30 s. Tính tốc độ trung bình.", answer: "5 m/s", scoringNote: "Viết đúng v = s/t và thay số có đơn vị." },
      { topic: "Điện học", stem: "Tính công suất của thiết bị dùng hiệu điện thế 220 V, cường độ dòng điện 0,5 A.", answer: "110 W", scoringNote: "Dùng P = UI; kết quả đúng và có đơn vị watt." },
    ],
  },
  {
    key: "hóa học",
    topics: ["Cấu tạo nguyên tử", "Liên kết hóa học", "Phản ứng hóa học", "Dung dịch", "Hóa hữu cơ"],
    actions: commonActions,
    multipleChoice: [
      { topic: "Cấu tạo nguyên tử", stem: "Hạt mang điện tích âm trong nguyên tử là", options: ["proton", "neutron", "hạt nhân", "electron"], answer: "D", explanation: "Electron mang điện tích âm và chuyển động quanh hạt nhân." },
      { topic: "Phản ứng hóa học", stem: "Phương trình nào biểu diễn phản ứng trung hòa?", options: ["HCl + NaOH → NaCl + H₂O", "2H₂ + O₂ → 2H₂O", "CaCO₃ → CaO + CO₂", "Fe + CuSO₄ → FeSO₄ + Cu"], answer: "A", explanation: "Axit phản ứng với bazơ tạo muối và nước là phản ứng trung hòa." },
      { topic: "Dung dịch", stem: "Hòa tan 10 g chất tan vào 90 g nước. Nồng độ phần trăm của dung dịch là", options: ["9%", "10%", "11,1%", "90%"], answer: "B", explanation: "C% = 10/(10 + 90) × 100% = 10%." },
      { topic: "Liên kết hóa học", stem: "Liên kết trong phân tử NaCl được hình thành chủ yếu do", options: ["Dùng chung electron", "Lực hút giữa các phân tử", "Lực hút tĩnh điện giữa ion trái dấu", "Sự xen phủ hạt nhân"], answer: "C", explanation: "NaCl gồm ion Na⁺ và Cl⁻ hút nhau bằng lực tĩnh điện." },
    ],
    trueFalse: [
      { topic: "Cấu tạo nguyên tử", context: "Xét nguyên tử trung hòa có 11 proton.", items: ["Nguyên tử có 11 electron.", "Số hiệu nguyên tử bằng 11.", "Hạt nhân mang điện tích âm.", "Nếu mất một electron, nguyên tử tạo ion dương."], answers: [true, true, false, true], explanation: "Nguyên tử trung hòa có số electron bằng proton; hạt nhân mang điện dương." },
    ],
    shortAnswer: [
      { topic: "Dung dịch", stem: "Tính khối lượng NaCl có trong 200 g dung dịch NaCl 5%.", answer: "10 g", scoringNote: "Dùng m chất tan = C% × m dung dịch / 100; ghi đúng đơn vị." },
      { topic: "Phản ứng hóa học", stem: "Cân bằng phương trình: Al + O₂ → Al₂O₃.", answer: "4Al + 3O₂ → 2Al₂O₃", scoringNote: "Hệ số tối giản, bảo toàn số nguyên tử Al và O." },
    ],
  },
  {
    key: "sinh học",
    topics: ["Di truyền học", "Tế bào", "Sinh thái học", "Tiến hóa", "Sinh lí học"],
    actions: commonActions,
    multipleChoice: [
      { topic: "Di truyền học", stem: "Đơn phân cấu tạo nên ADN là", options: ["axit amin", "nucleotide", "glucose", "axit béo"], answer: "B", explanation: "ADN là đại phân tử được cấu tạo từ các nucleotide." },
      { topic: "Tế bào", stem: "Bào quan thực hiện quang hợp ở tế bào thực vật là", options: ["ti thể", "ribosome", "lục lạp", "bộ máy Golgi"], answer: "C", explanation: "Lục lạp chứa hệ sắc tố và cấu trúc phục vụ quang hợp." },
      { topic: "Sinh thái học", stem: "Tập hợp các cá thể cùng loài, sống trong một khu vực xác định, gọi là", options: ["quần thể", "quần xã", "hệ sinh thái", "sinh quyển"], answer: "A", explanation: "Đó là định nghĩa của quần thể sinh vật." },
      { topic: "Di truyền học", stem: "Trong phép lai Aa × Aa, xác suất đời con có kiểu gen aa là", options: ["1/2", "3/4", "1", "1/4"], answer: "D", explanation: "Tỉ lệ kiểu gen là 1AA : 2Aa : 1aa." },
    ],
    trueFalse: [
      { topic: "Di truyền học", context: "Xét phép lai một cặp tính trạng với bố mẹ Aa × Aa.", items: ["Mỗi bên bố mẹ tạo hai loại giao tử A và a.", "Tỉ lệ kiểu gen đời con là 1 : 2 : 1.", "Mọi cá thể đời con đều có kiểu hình trội.", "Xác suất xuất hiện kiểu gen đồng hợp lặn là 25%."], answers: [true, true, false, true], explanation: "Sơ đồ lai cho 1AA : 2Aa : 1aa; nếu trội hoàn toàn thì kiểu hình lặn chiếm 25%." },
    ],
    shortAnswer: [
      { topic: "Di truyền học", stem: "Nêu tỉ lệ kiểu gen của phép lai Aa × Aa.", answer: "1AA : 2Aa : 1aa", scoringNote: "Lập đúng giao tử hoặc bảng lai và kết luận đúng tỉ lệ." },
      { topic: "Sinh thái học", stem: "Nêu một biện pháp giúp bảo vệ đa dạng sinh học tại địa phương.", answer: "Bảo vệ sinh cảnh và không săn bắt, khai thác sinh vật trái phép.", scoringNote: "Chấp nhận biện pháp hợp lí, cụ thể và có tác dụng bảo tồn." },
    ],
  },
  {
    key: "địa lí",
    topics: ["Dân số", "Lao động", "Nông nghiệp", "Công nghiệp", "Dịch vụ", "Các vùng kinh tế Việt Nam"],
    actions: commonActions,
    multipleChoice: [
      { topic: "Kinh tế Việt Nam", stem: "Nhân tố quan trọng thúc đẩy sự chuyển dịch cơ cấu kinh tế Việt Nam hiện nay là", options: ["Giảm giao lưu giữa các vùng", "Công nghiệp hóa và hội nhập kinh tế", "Chỉ phát triển nông nghiệp", "Hạn chế ứng dụng khoa học"], answer: "B", explanation: "Công nghiệp hóa, hiện đại hóa và hội nhập thúc đẩy chuyển dịch cơ cấu ngành và lãnh thổ." },
      { topic: "Dân số", stem: "Lợi thế nổi bật của cơ cấu dân số vàng là", options: ["Nguồn lao động dồi dào", "Tỉ lệ người phụ thuộc rất cao", "Không cần đào tạo nghề", "Phân bố dân cư đồng đều"], answer: "A", explanation: "Tỉ lệ người trong độ tuổi lao động cao tạo nguồn nhân lực lớn." },
      { topic: "Nông nghiệp", stem: "Điều kiện thuận lợi để phát triển cây công nghiệp lâu năm ở Tây Nguyên là", options: ["Nhiều bãi triều", "Khí hậu ôn đới quanh năm", "Đất badan rộng lớn", "Mạng lưới sông ngòi dày đặc nhất nước"], answer: "C", explanation: "Đất badan và khí hậu cận xích đạo thuận lợi cho cà phê, cao su, hồ tiêu." },
      { topic: "Dịch vụ", stem: "Hoạt động nào thuộc khu vực dịch vụ?", options: ["Trồng lúa", "Khai thác than", "Chế biến thủy sản", "Vận tải hàng hóa"], answer: "D", explanation: "Vận tải là một ngành dịch vụ." },
    ],
    trueFalse: [
      { topic: "Kinh tế Việt Nam", context: "Xét sự chuyển dịch cơ cấu kinh tế Việt Nam.", items: ["Tỉ trọng các ngành thay đổi theo hướng công nghiệp hóa.", "Dịch vụ không có vai trò trong nền kinh tế.", "Các vùng kinh tế có thế mạnh khác nhau.", "Cơ sở hạ tầng ảnh hưởng đến phân bố sản xuất."], answers: [true, false, true, true], explanation: "Dịch vụ ngày càng quan trọng; cơ cấu ngành và lãnh thổ thay đổi theo điều kiện và định hướng phát triển." },
    ],
    shortAnswer: [
      { topic: "Kinh tế Việt Nam", stem: "Nêu hai điều kiện giúp phát triển dịch vụ du lịch ở Việt Nam.", answer: "Tài nguyên du lịch tự nhiên, văn hóa phong phú và cơ sở hạ tầng ngày càng cải thiện.", scoringNote: "Nêu được hai nhóm điều kiện hợp lí; chấp nhận ví dụ cụ thể." },
      { topic: "Nông nghiệp", stem: "Giải thích ngắn gọn vì sao Tây Nguyên chuyên môn hóa cây công nghiệp lâu năm.", answer: "Có diện tích đất badan lớn, khí hậu phù hợp và vùng sản xuất tập trung.", scoringNote: "Cần nêu ít nhất hai điều kiện tự nhiên hoặc kinh tế - xã hội phù hợp." },
    ],
  },
];

export function getSubjectPack(subject: string): SubjectPack {
  const normalized = subject.trim().toLowerCase();
  return packs.find((pack) => normalized.includes(pack.key)) ?? packs[0];
}

export const supportedSubjectPacks = packs.map((pack) => pack.key);
