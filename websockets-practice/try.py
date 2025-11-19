import asyncio


async def hello():
    print("hello")
    await asyncio.sleep(5)
    print("world")
    return "done"


async def main():
    try:
        result = await asyncio.wait_for(hello(), timeout=7)
        print(result)
    except asyncio.TimeoutError as e:
        print(e)


if __name__ == "__main__":
    asyncio.run(main())
