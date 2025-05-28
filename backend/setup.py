from setuptools import setup, find_packages

setup(
    name='backend',
    version='0.1.0',
    packages=find_packages(where='.', include=['app', 'app.*']),
    install_requires=[
        # Dependências listadas em requirements.txt
    ],
    # Outras configurações como metadata, entry_points, etc., podem ser adicionadas aqui
) 