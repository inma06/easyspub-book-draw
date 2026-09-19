export function createBook(values = {}) {
  return Object.freeze({
    url: values.url?.trim() || "",
    title: values.title?.trim() || "",
    author: values.author?.trim() || "",
    description: values.description?.trim() || "",
    image: values.image?.trim() || "",
  });
}

export function bookLabel(book) {
  return book.title ? `${book.title}${book.author ? ` - ${book.author}` : ""}` : "";
}
