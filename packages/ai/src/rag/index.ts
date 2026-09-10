export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    restaurantId: string;
    restaurantName: string;
    type: "MENU_ITEM" | "RESTAURANT_INFO" | "FAQ";
    category?: string;
    price?: number;
  };
}

export interface RAGRetriever {
  search(query: string, limit?: number): Promise<RAGDocument[]>;
}

export class SimpleRAGRetriever implements RAGRetriever {
  private documents: RAGDocument[] = [];

  constructor(initialDocs: RAGDocument[] = []) {
    this.documents = initialDocs;
  }

  async search(query: string, limit = 5): Promise<RAGDocument[]> {
    const q = query.toLowerCase();
    return this.documents
      .filter((doc) => doc.content.toLowerCase().includes(q))
      .slice(0, limit);
  }
}
