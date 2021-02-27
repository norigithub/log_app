import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="log_app", # Replace with your own username
    version="0.0.4",
    install_requires=[
        "geoip2",
    ],
    package_data = {
    'log_app': ['template/*'],
    },
    author="Nori",
    author_email="nori755@gmail.com",
    description="Log analysis tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    packages=setuptools.find_packages(),
    python_requires='>=3.8',
)
