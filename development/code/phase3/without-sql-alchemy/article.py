from magazine import Magazine

class Article:
    def __init__(self, author, magazine, title):
        from author import Author  # local import to avoid circular import
        # Validate author type
        if not isinstance(author, Author):
            raise TypeError("author must be an Author instance")
        # Validate magazine type
        if not isinstance(magazine, Magazine):
            raise TypeError("magazine must be a Magazine instance")
        # Validate title type and length
        if not isinstance(title, str):
            raise TypeError("title must be a string")
        if not (5 <= len(title) <= 50):
            raise ValueError("title length must be between 5 and 50 characters")
        
        self._author = author
        self._magazine = magazine
        self._title = title

    @property
    def author(self):
        return self._author

    @author.setter
    def author(self, value):
        if not isinstance(value, Author):
            raise TypeError("author must be an Author instance")
        self._author = value

    @property
    def magazine(self):
        return self._magazine

    @magazine.setter
    def magazine(self, value):
        if not isinstance(value, Magazine):
            raise TypeError("magazine must be a Magazine instance")
        self._magazine = value

    @property
    def title(self):
        return self._title

    @title.setter
    def title(self, value):
        # Title is immutable after instantiation
        if hasattr(self, '_title'):
            raise AttributeError("title cannot be changed after instantiation")
        if not isinstance(value, str):
            raise TypeError("title must be a string")
        if not (5 <= len(value) <= 50):
            raise ValueError("title length must be between 5 and 50 characters")
        self._title = value
