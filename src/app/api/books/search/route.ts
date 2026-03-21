import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const isbn = searchParams.get("isbn");
  const start = searchParams.get("start") || "1";
  const display = searchParams.get("display") || "10";

  if (!query && !isbn) {
    return NextResponse.json(
      { error: "query 또는 isbn 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "네이버 API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams({
      start,
      display,
    });

    if (isbn) {
      params.set("d_isbn", isbn);
    } else if (query) {
      params.set("query", query);
    }

    const response = await fetch(
      `https://openapi.naver.com/v1/search/book.json?${params.toString()}`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Book search error:", error);
    return NextResponse.json(
      { error: "책 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
