# lib/author.py
from article import Article
from magazine import Magazine

class Author:
    def __init__(self, name):
        self._name = None
        self.name = name
        self._articles = []

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        if not isinstance(value, str):
            raise ValueError("Name must be a string")
        if len(value) == 0:
            raise ValueError("Name must be longer than 0 characters")
        if hasattr(self, '_name') and self._name is not None:
            raise AttributeError("Name cannot be changed after instantiation")
        self._name = value

    def articles(self):
        return self._articles

    def magazines(self):
        return list(set(article.magazine for article in self._articles))

    def add_article(self, magazine, title):
        article = Article(self, magazine, title)
        self._articles.append(article)
        magazine._articles.append(article)
        return article

    def topic_areas(self):
        categories = list(set(article.magazine.category for article in self._articles))
        return categories if categories else None
