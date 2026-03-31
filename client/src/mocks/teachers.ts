export type TeacherPublication = {
  text: string;
  year: number | null;
  index: number;
};

export type Teacher = {
  id: number;
  name: string;
  title: string;
  academicDegree: string;
  position: string;
  faculty: string;
  shortInformation: string;
  bio: string;
  publications: TeacherPublication[];
  imageUrl: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export const mockTeachersResponse = {
  teachers: [
    {
      id: 1,
      name: "Севбо Володимир Іванович",
      title: "Кандидат педагогічних наук, доцент. Ст. викладач",
      academicDegree: "к. пед. н.",
      position: "Доцент",
      faculty: "Математичний факультет",
      shortInformation:
        "кандидат педагогічних наук, доцент. Ст. викладач (16.11.1946 – 01.09.1950), доцент (01.09.1950 – 16.03.1953), зав. кафедри (16.03.1953 – 01.08.1958), доцент (01.08.1958 – 26.08.1965), зав. кафедри (26.08.1965 – 28.08.1966), доцент (28.08.1966 – 20.01.1968).",
      bio: "Народився 21 грудня 1898 року. Протягом роботи в УжДУ читав курси і проводив практичні заняття з вищої математики, алгебри, математичного аналізу, диференціальної геометрії, історії математики.",
      publications: [
        {
          text: "Обратные круговые функции в школе // Математика в школе. – М., 1937. – № 6.",
          year: 1937,
          index: 1,
        },
      ],
      imageUrl: "/teachers_img/images/1.jpg",
      slug: "sevbo-volodymyr-ivanovych",
      createdAt: "2025-11-30T20:33:15.210Z",
      updatedAt: "2025-11-30T20:33:15.210Z",
    },
    {
      id: 2,
      name: "Хічій Остап Федорович",
      title: "Кандидат педагогічних наук, доцент.",
      academicDegree: "к. пед. н.",
      position: "Доцент",
      faculty: "Математичний факультет",
      shortInformation:
        "кандидат педагогічних наук, доцент. Ст. викладач (11.02.1947 – 01.09.1960), доцент, зав. кафедри (01.09.1960 – 01.01.1970), декан Виноградівського заочного факультету.",
      bio: "Народився 6 листопада 1905 року. Протягом роботи в УжДУ читав курси і проводив практичні заняття з вищої математики, аналітичної геометрії.",
      publications: [],
      imageUrl: "/teachers_img/images/2.jpg",
      slug: "khichii-ostap-fedorovych",
      createdAt: "2025-11-30T20:33:15.218Z",
      updatedAt: "2025-11-30T20:33:15.218Z",
    },
    {
      id: 3,
      name: "Зарицький Мирон Онуфрієвич",
      title: "Доктор філософії, кандидат фіз.- мат. наук, професор.",
      academicDegree: "к. ф.-м. н.",
      position: "Професор",
      faculty: "Математичний факультет",
      shortInformation:
        "доктор філософії (Львів 1930), професор (1945), кандидат фіз.-мат. наук (1946), професор, зав. кафедри (01.09.1950 – 15.03.1953).",
      bio: "Народився 21 травня 1889 року. З грудня 1939 року працював у Львівському університеті, у 1950-1953 роках за сумісництвом очолював кафедру загальної математики УжДУ.",
      publications: [],
      imageUrl: "/teachers_img/images/3.jpg",
      slug: "zarytskyi-myron-onufriievych",
      createdAt: "2025-11-30T20:33:15.221Z",
      updatedAt: "2025-11-30T20:33:15.221Z",
    },
    {
      id: 4,
      name: "Ковач Юрій Іванович",
      title: "Кандидат фіз.-мат. наук, доцент.",
      academicDegree: "к. ф.-м. н.",
      position: "Доцент",
      faculty: "Математичний факультет",
      shortInformation:
        "кандидат фіз.-мат. наук, доцент. ст. викладач (01.09.1957 – 01.09.1966), доцент (01.09.1966 – 01.09.1983).",
      bio: "Народився 21 лютого 1921 року. Протягом роботи в УжДУ читав курси, проводив практичні й лабораторні заняття з математичного аналізу, дифрівнянь та рівнянь матфізики.",
      publications: [],
      imageUrl: "/teachers_img/images/4.jpg",
      slug: "kovach-iurii-ivanovych",
      createdAt: "2025-11-30T20:33:15.223Z",
      updatedAt: "2025-11-30T20:33:15.223Z",
    },
    {
      id: 5,
      name: "Галасі Андрій Андрійович",
      title: "Кандидат фіз.-мат. наук, доцент.",
      academicDegree: "к. ф.-м. н.",
      position: "Доцент",
      faculty: "Математичний факультет",
      shortInformation:
        "кандидат фіз.-мат. наук, доцент. Викладач (16.08.1952 – 01.10.1953), ст. викладач (01.10.1953 – 01.09.1967), доцент (01.09.1967 – 19.06.1994).",
      bio: "Народився 12 січня 1928 року. Протягом роботи в УжДУ читав курси і проводив практичні заняття з теоретичної механіки та спецкурсів.",
      publications: [],
      imageUrl: "/teachers_img/images/5.jpg",
      slug: "halasi-andrii-andriiovych",
      createdAt: "2025-11-30T20:33:15.227Z",
      updatedAt: "2025-11-30T20:33:15.227Z",
    },
    {
      id: 6,
      name: "Гартштейн Белла Наумівна",
      title: "Кандидат фіз.-мат. наук, доцент.",
      academicDegree: "к. ф.-м. н.",
      position: "Доцент",
      faculty: "Математичний факультет",
      shortInformation:
        "кандидат фіз.-мат. наук, доцент. Ст. викладач (16.10.1951 – 01.09.1952), доцент (01.09.1952 – 10.10.1967).",
      bio: "Народилася 16 липня 1924 року. В УжДУ та ХІРЕ читала курси з матаналізу, ТФКЗ, теорії ймовірностей та матстатистики.",
      publications: [],
      imageUrl: "/teachers_img/images/6.jpg",
      slug: "hartshtein-bella-naumivna",
      createdAt: "2025-11-30T20:33:15.229Z",
      updatedAt: "2025-11-30T20:33:15.229Z",
    },
    {
      id: 7,
      name: "Берман Самуїл Давидович",
      title: "Доктор фіз.- мат. наук, професор.",
      academicDegree: "д. ф.-м. н., к. ф.-м. н.",
      position: "Професор",
      faculty: "Математичний факультет",
      shortInformation:
        "доктор фіз.-мат. наук, професор. доцент (01.10.1953 – 01.10.1964), професор (01.10.1964 – 10.10.1967). Зав. кафедри (01.09.1959 – 10.10.1967).",
      bio: "Народився 3 січня 1922 року. Працював в УжДУ на посаді завідувача кафедри загальної математики до 1967 року.",
      publications: [],
      imageUrl: "/teachers_img/images/7.jpg",
      slug: "berman-samuil-davydovych",
      createdAt: "2025-11-30T20:33:15.231Z",
      updatedAt: "2025-11-30T20:33:15.231Z",
    },
    {
      id: 8,
      name: "Студнєв Юрій Петрович",
      title: "Доктор фіз.- мат. наук, професор.",
      academicDegree: "д. ф.-м. н., к. ф.-м. н.",
      position: "Професор",
      faculty: "",
      shortInformation:
        "доктор фіз.-мат. наук, професор. доцент (01.09.1954 – 29.11.1972), професор (29.11.1972 – 23.04.1998). Зав. кафедри (01.10.1953 – 01.09.1993).",
      bio: "Народився 17 червня 1923 року. В УжДУ читав лекції з математичного аналізу, теорії функцій дійсної змінної, функціонального аналізу та інтегральних рівнянь.",
      publications: [],
      imageUrl: "/teachers_img/images/8.jpg",
      slug: "studniev-iurii-petrovych",
      createdAt: "2025-11-30T20:33:15.234Z",
      updatedAt: "2025-11-30T20:33:15.234Z",
    },
    {
      id: 9,
      name: "П’ятковська Вікторія Олександрівна",
      title: "Асистент",
      academicDegree: "",
      position: "",
      faculty: "",
      shortInformation: "асистент (01.09.1953 – 25.08.1954).",
      bio: "",
      publications: [],
      imageUrl: "/profile-icon.webp",
      slug: "piatkovska-viktoriia-oleksandrivna",
      createdAt: "2025-11-30T20:33:15.237Z",
      updatedAt: "2025-12-16T14:50:01.567Z",
    },
    {
      id: 10,
      name: "Айзенберг Наум Нісонович",
      title: "Кандидат фіз.- мат. наук, професор.",
      academicDegree: "к. ф.-м. н.",
      position: "Професор",
      faculty: "Математичний факультет",
      shortInformation:
        "кандидат фіз.-мат. наук, професор. викладач (01.09.1957 – 01.09.1958), ст. викладач (01.09.1958 – 01.09.1963), доцент (01.09.1963 – 01.12.1975), професор (01.12.1975 – 04.09.2002).",
      bio: "Народився 2 вересня 1928 року. В УжДУ читав курси з математичної логіки, алгебри, аналітичної геометрії, дискретної математики та курсів за вибором.",
      publications: [],
      imageUrl: "/teachers_img/images/10.jpg",
      slug: "aizenberh-naum-nisonovych",
      createdAt: "2025-11-30T20:33:15.238Z",
      updatedAt: "2025-11-30T20:33:15.238Z",
    },
    {
      id: 11,
      name: "Росса Ганна Романівна",
      title: "Кандидат фіз.-мат. наук, доцент.",
      academicDegree: "к. ф.-м. н.",
      position: "Доцент",
      faculty: "Математичний факультет",
      shortInformation:
        "кандидат фіз.-мат. наук, доцент. Асистент (01.09.1954 – 01.09.1960), ст. викладач (01.09.1960 – 01.11.1963), доцент (01.11.1966 – 01.08.1987), (01.11.1989 – 30.06.1991).",
      bio: "Народилася 23 липня 1928 року. Протягом роботи читала курси і проводила практичні заняття з вищої математики, теорії чисел, елементарної математики та основ геометрії.",
      publications: [],
      imageUrl: "/teachers_img/images/11.jpg",
      slug: "rossa-hanna-romanivna",
      createdAt: "2025-11-30T20:33:15.241Z",
      updatedAt: "2025-11-30T20:33:15.241Z",
    },
    {
      id: 12,
      name: "Береславський Михайло Давидович",
      title: "Старший викладач",
      academicDegree: "",
      position: "Старший викладач",
      faculty: "Математичний факультет",
      shortInformation:
        "ст. викладач. Асистент (01.09.1954 – 01.09.1957), викладач (01.09.1957 – 01.09.1958), ст. викладач (01.09.1958 – 30.06.1977).",
      bio: "Народився 12 червня 1917 року. Протягом роботи в учительському інституті та УжДУ читав курси і проводив практичні заняття з вищої математики та диференціальної геометрії.",
      publications: [],
      imageUrl: "/teachers_img/images/12.jpg",
      slug: "bereslavskyi-mykhailo-davydovych",
      createdAt: "2025-11-30T20:33:15.243Z",
      updatedAt: "2025-11-30T20:33:15.243Z",
    },
  ] as Teacher[],
  total: 179,
  totalPages: 15,
  currentPage: 1,
};

export function getMockTeachersPage(page = 1, limit = 24) {
  const start = (page - 1) * limit;
  const end = start + limit;
  const teachers = mockTeachersResponse.teachers.slice(start, end);
  return {
    teachers,
    total: mockTeachersResponse.total,
    totalPages: Math.max(1, Math.ceil(mockTeachersResponse.total / limit)),
    currentPage: page,
  };
}

export function findMockTeacherBySlug(slug: string) {
  return mockTeachersResponse.teachers.find((teacher) => teacher.slug === slug) || null;
}
