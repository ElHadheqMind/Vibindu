
class BaseTool:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    async def execute(self, *args, **kwargs):
        raise NotImplementedError
