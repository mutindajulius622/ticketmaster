class Magazine:
    _all_magazines = []

    def __init__(self, name, category):
        # Validate name type and length
        if not isinstance(name, str):
            raise TypeError("name must be a string")
        if not (2 <= len(name) <= 16):
            raise ValueError("name length must be between 2 and 16 characters")
        # Validate category type and length
        if not isinstance(category, str):
            raise TypeError("category must be a string")
        if len(category) == 0:
            raise ValueError("category must be longer than 0 characters")

        self._name = name
        self._category = category
        self._articles = []
        Magazine._all_magazines.append(self)

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        if not isinstance(value, str):
            raise TypeError("name must be a string")
        if not (2 <= len(value) <= 16):
            raise ValueError("name length must be between 2 and 16 characters")
        self._name = value

    @property
    def category(self):
        return self._category

    @category.setter
    def category(self, value):
        if not isinstance(value, str):
            raise TypeError("category must be a string")
        if len(value) == 0:
            raise ValueError("category must be longer than 0 characters")
        self._category = value

    def articles(self):
        return self._articles

    def contributors(self):
        # Unique list of authors who have written for this magazine
        return list(set(article.author for article in self._articles))

    def article_titles(self):
        if not self._articles:
            return None
        return [article.title for article in self._articles]

    def contributing_authors(self):
        if not self._articles:
            return None
        from collections import Counter
        author_counts = Counter(article.author for article in self._articles)
        contributing = [author for author, count in author_counts.items() if count > 2]
        return contributing if contributing else None

    @classmethod
    def top_publisher(cls):
        if not cls._all_magazines:
            return None
        # Return None if all magazines have 0 articles
        top = max(cls._all_magazines, key=lambda mag: len(mag._articles))
        if len(top._articles) == 0:
            return None
        return top
