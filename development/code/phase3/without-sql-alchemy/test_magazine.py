import unittest
from author import Author
from article import Article
from magazine import Magazine

class MagazineTestCase(unittest.TestCase):
    def setUp(self):
        # Clear magazines list to avoid persistence between tests
        Magazine._all_magazines.clear()
        
        self.author1 = Author("Alice")
        self.author2 = Author("Bob")
        self.mag1 = Magazine("TechToday", "Technology")
        self.mag2 = Magazine("HealthPlus", "Health")

    def test_author_initialization_valid(self):
        self.assertEqual(self.author1.name, "Alice")
    
    def test_author_initialization_invalid(self):
        with self.assertRaises(ValueError):
            Author("")
        with self.assertRaises(ValueError):
            Author(123)

    def test_author_name_immutable(self):
        with self.assertRaises(AttributeError):
            self.author1.name = "NewName"

    def test_magazine_initialization_valid(self):
        self.assertEqual(self.mag1.name, "TechToday")
        self.assertEqual(self.mag1.category, "Technology")
    
    def test_magazine_initialization_invalid(self):
        with self.assertRaises(ValueError):
            Magazine("A", "Category")  # name too short
        with self.assertRaises(ValueError):
            Magazine("ValidName", "")  # empty category
        with self.assertRaises(TypeError):
            Magazine(123, "Category")  # name wrong type
        with self.assertRaises(TypeError):
            Magazine("Valid", 123)  # category wrong type

    def test_magazine_name_setter_valid(self):
        self.mag1.name = "NewName"
        self.assertEqual(self.mag1.name, "NewName")

    def test_magazine_name_setter_invalid(self):
        with self.assertRaises(ValueError):
            self.mag1.name = "A"
        with self.assertRaises(TypeError):
            self.mag1.name = 123

    def test_magazine_category_setter_valid(self):
        self.mag1.category = "Science"
        self.assertEqual(self.mag1.category, "Science")

    def test_magazine_category_setter_invalid(self):
        with self.assertRaises(ValueError):
            self.mag1.category = ""
        with self.assertRaises(TypeError):
            self.mag1.category = 123

    def test_article_creation(self):
        article = self.author1.add_article(self.mag1, "Innovation in AI")
        self.assertEqual(article.title, "Innovation in AI")
        self.assertEqual(article.author, self.author1)
        self.assertEqual(article.magazine, self.mag1)

    def test_article_creation_invalid_title(self):
        with self.assertRaises(ValueError):
            self.author1.add_article(self.mag1, "Shrt")
        with self.assertRaises(TypeError):
            self.author1.add_article(self.mag1, 12345)

    def test_article_title_immutable(self):
        article = self.author1.add_article(self.mag1, "Immutable Title Test")
        with self.assertRaises(AttributeError):
            article.title = "New Title"

    def test_author_articles_magazines(self):
        article1 = self.author1.add_article(self.mag1, "Article One")
        article2 = self.author1.add_article(self.mag2, "Article Two")
        self.assertIn(article1, self.author1.articles())
        self.assertIn(article2, self.author1.articles())
        self.assertIn(self.mag1, self.author1.magazines())
        self.assertIn(self.mag2, self.author1.magazines())

    def test_magazine_articles_contributors(self):
        self.author1.add_article(self.mag1, "Mag Article 1")
        self.author2.add_article(self.mag1, "Mag Article 2")
        contributors = self.mag1.contributors()
        self.assertIn(self.author1, contributors)
        self.assertIn(self.author2, contributors)
        articles = self.mag1.articles()
        self.assertEqual(len(articles), 2)

    def test_magazine_article_titles(self):
        self.author1.add_article(self.mag1, "Article Title 1")
        self.author2.add_article(self.mag1, "Article Title 2")
        titles = self.mag1.article_titles()
        self.assertIn("Article Title 1", titles)
        self.assertIn("Article Title 2", titles)

    def test_magazine_article_titles_no_articles(self):
        new_mag = Magazine("EmptyMag", "General")
        self.assertIsNone(new_mag.article_titles())

    def test_magazine_contributing_authors(self):
        self.author1.add_article(self.mag1, "Article 1")
        self.author1.add_article(self.mag1, "Article 2")
        self.author1.add_article(self.mag1, "Article 3")
        self.author2.add_article(self.mag1, "Article 4")
        contributing = self.mag1.contributing_authors()
        self.assertIn(self.author1, contributing)
        self.assertNotIn(self.author2, contributing)

    def test_magazine_contributing_authors_no_authors(self):
        new_mag = Magazine("AnotherMag", "Lifestyle")
        self.assertIsNone(new_mag.contributing_authors())

    def test_author_topic_areas(self):
        self.author1.add_article(self.mag1, "Area 1")
        self.author1.add_article(self.mag2, "Area 2")
        topic_areas = self.author1.topic_areas()
        self.assertIn("Technology", topic_areas)
        self.assertIn("Health", topic_areas)

    def test_author_topic_areas_none(self):
        new_author = Author("New Author")
        self.assertIsNone(new_author.topic_areas())

    def test_magazine_top_publisher(self):
        self.assertIsNone(Magazine.top_publisher())
        self.author2.add_article(self.mag2, "Health1")
        self.author2.add_article(self.mag2, "Health2")
        self.author1.add_article(self.mag1, "Tech1")
        self.author1.add_article(self.mag1, "Tech2")
        self.author1.add_article(self.mag1, "Tech3")
        top = Magazine.top_publisher()
        self.assertEqual(top, self.mag1)

if __name__ == '__main__':
    unittest.main()
